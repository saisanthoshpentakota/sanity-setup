import { LYTICS_FLOW_NAME, LYTICS_FLOW_STATE, PROJECT_NAME } from './inline-targeting.constants';
import { AttributeManager } from './services/attribute-manager.service';
import { ConfigService } from './services/config.service';
import {
  ExperienceManager,
} from './services/experience-manager.service';
import { LoggerService } from './services/logger.service';
import { LyticsGatewayService, LyticsGatewayUnavailableError } from './services/lytics-gateway.service';
import { ProjectManager } from './services/project-manager.service';
import { Experience, Rule } from './types';
import { VariantManager } from './variant-manager.service';

// ECL-2252: one-time (outside CI) provisioning of the two standing fixtures
// used by the v2 inline-targeting e2e test. Both fixtures are left PAUSED as
// their resting state - the test itself activates/pauses them per run.
// Requires the project from setup-inline-targeting-project to already exist.
const SEGMENTED_EXPERIENCE_NAME = 'Inline Targeting Segmented';
const AB_TEST_EXPERIENCE_NAME = 'Inline Targeting A/B';

function lyticsGatewayError(error: Error): Error {
  return error instanceof LyticsGatewayUnavailableError
    ? new Error(`Lytics account is not connected for the project behind LYTICS_PROJECT_UID (${error.message})`)
    : error;
}

type FixtureRules = {
  usCountry: Rule;
  caCountry: Rule;
  heightAbove60: Rule;
  heightBelow60: Rule;
  lyticsAudience: Rule;
  lyticsFlowState: Rule;
};

async function setupInlineTargetingFixtures(config: ConfigService, logger: LoggerService): Promise<void> {
  logger.log('Setting up inline targeting fixtures (ECL-2252)...');

  const projectManager = new ProjectManager(logger, config);
  const attributeManager = new AttributeManager(logger, config);
  const experienceManager = new ExperienceManager(logger, config);
  const lyticsGateway = new LyticsGatewayService(logger, config);
  const variantManager = new VariantManager();

  const project = await projectManager.findProjectByName(PROJECT_NAME);
  if (project.isErr()) throw new Error(`Failed to look up project "${PROJECT_NAME}"`);
  if (!project.value) {
    throw new Error(
      `Project "${PROJECT_NAME}" does not exist. Run "npm run setup-inline-targeting-project" first.`
    );
  }

  const projectUid = project.value.uid;

  // A non-200/network failure from either Lytics gateway call means the
  // project behind LYTICS_PROJECT_UID has no working Lytics connection -
  // fail fast here instead of partway through fixture provisioning. A
  // successful response that's just missing the expected segment/flow is a
  // different problem (Lytics data, not the connection) and gets its own
  // message.
  const allAudienceUid = await lyticsGateway.fetchAllAudienceUid();
  if (allAudienceUid.isErr()) throw lyticsGatewayError(allAudienceUid.error);

  const flowId = await lyticsGateway.fetchFlowIdByName(LYTICS_FLOW_NAME);
  if (flowId.isErr()) throw lyticsGatewayError(flowId.error);

  const existingSegmented = await experienceManager.findExperienceByName(SEGMENTED_EXPERIENCE_NAME, projectUid);
  if (existingSegmented.isErr()) throw new Error('Failed to look up segmented fixture experience');
  const existingAbTest = await experienceManager.findExperienceByName(AB_TEST_EXPERIENCE_NAME, projectUid);
  if (existingAbTest.isErr()) throw new Error('Failed to look up A/B fixture experience');

  const existingAttribute = await attributeManager.findAttributeByKey('height', projectUid);
  if (existingAttribute.isErr()) throw new Error('Failed to look up height attribute');

  let heightAttributeUid: string;
  if (existingAttribute.value) {
    heightAttributeUid = existingAttribute.value.uid;
  } else {
    const attribute = await attributeManager.createAttribute(
      'height',
      'height',
      'defines height of the audience',
      projectUid
    );
    if (attribute.isErr()) throw new Error('Failed to create height attribute');
    heightAttributeUid = attribute.value.uid;
  }

  const rules: FixtureRules = {
    usCountry: variantManager.presetAttributeRule('COUNTRY', 'STRING_EQUALS', 'US'),
    caCountry: variantManager.presetAttributeRule('COUNTRY', 'STRING_EQUALS', 'CA'),
    heightAbove60: variantManager.customAttributeRule(heightAttributeUid, 'NUMBER_GREATER_THAN', 60),
    heightBelow60: variantManager.customAttributeRule(heightAttributeUid, 'NUMBER_LESS_THAN', 60),
    lyticsAudience: variantManager.lyticsAudienceRule(allAudienceUid.value),
    lyticsFlowState: variantManager.lyticsFlowStateRule(flowId.value, LYTICS_FLOW_STATE),
  };

  const segmentedShortUid = await setupSegmentedFixture(
    experienceManager, variantManager, projectUid, rules, logger, existingSegmented.value
  );
  const abTestShortUid = await setupAbTestFixture(
    experienceManager, variantManager, projectUid, rules, logger, existingAbTest.value
  );

  logger.success('Inline targeting fixtures provisioned and left PAUSED');
  logger.success(`Project uid: ${projectUid}`);
  logger.success(`Segmented fixture short uid: ${segmentedShortUid} (targeted variant short uid: 0)`);
  logger.success(`A/B fixture short uid: ${abTestShortUid} (targeted variant short uid: 0)`);
}

async function setupSegmentedFixture(
  experienceManager: ExperienceManager,
  variantManager: VariantManager,
  projectUid: string,
  rules: FixtureRules,
  logger: LoggerService,
  existing: Experience | null
): Promise<string | null> {
  if (existing) {
    logger.success(`Segmented fixture "${SEGMENTED_EXPERIENCE_NAME}" already provisioned (uid: ${existing.uid})`);
    return existing.shortUid;
  }

  const experience = await experienceManager.createExperience(
    SEGMENTED_EXPERIENCE_NAME,
    'AND of preset/custom/Lytics-audience/Lytics-flow-state inline rules',
    'SEGMENTED',
    projectUid,
    2
  );
  if (experience.isErr()) throw new Error('Failed to create segmented fixture experience');
  const experienceUid = experience.value.uid;

  const draftVersion = await experienceManager.fetchDraftVersion(experienceUid, projectUid);
  if (draftVersion.isErr()) throw new Error('Failed to fetch segmented fixture draft version');
  const versionUid = draftVersion.value.uid;

  const target = variantManager.ruleCombination('AND', [
    rules.usCountry,
    rules.heightAbove60,
    rules.lyticsAudience,
    rules.lyticsFlowState,
  ]);
  const targetedVariant = variantManager.createInlineTargetSegmentedVariant('Targeted', target);

  const updated = await experienceManager.updateVersionedExperience(
    'DRAFT',
    [targetedVariant],
    experienceUid,
    versionUid,
    projectUid,
    undefined,
    undefined,
    2
  );
  if (updated.isErr()) throw new Error('Failed to update segmented fixture experience');

  const activated = await experienceManager.activateExperience(updated.value, versionUid, experienceUid, projectUid, 2);
  if (activated.isErr()) throw new Error('Failed to activate segmented fixture experience');

  const paused = await experienceManager.pauseExperience(activated.value, versionUid, experienceUid, projectUid, 2);
  if (paused.isErr()) throw new Error('Failed to pause segmented fixture experience back to its resting state');

  const shortUid = await experienceManager.getShortUid(experienceUid, projectUid);
  if (shortUid.isErr()) throw new Error('Failed to fetch segmented fixture short uid');

  logger.success(`Segmented fixture "${SEGMENTED_EXPERIENCE_NAME}" provisioned (uid: ${experienceUid})`);
  return shortUid.value;
}

async function setupAbTestFixture(
  experienceManager: ExperienceManager,
  variantManager: VariantManager,
  projectUid: string,
  rules: FixtureRules,
  logger: LoggerService,
  existing: Experience | null
): Promise<string | null> {
  if (existing) {
    logger.success(`A/B fixture "${AB_TEST_EXPERIENCE_NAME}" already provisioned (uid: ${existing.uid})`);
    return existing.shortUid;
  }

  const experience = await experienceManager.createExperience(
    AB_TEST_EXPERIENCE_NAME,
    'OR of preset/custom/Lytics-audience/Lytics-flow-state inline rules',
    'AB_TEST',
    projectUid,
    2
  );
  if (experience.isErr()) throw new Error('Failed to create A/B fixture experience');
  const experienceUid = experience.value.uid;

  const draftVersion = await experienceManager.fetchDraftVersion(experienceUid, projectUid);
  if (draftVersion.isErr()) throw new Error('Failed to fetch A/B fixture draft version');
  const versionUid = draftVersion.value.uid;

  const target = variantManager.ruleCombination('OR', [
    rules.caCountry,
    rules.heightBelow60,
    rules.lyticsAudience,
    rules.lyticsFlowState,
  ]);
  // AB_TEST experiences require at least 2 variants to activate - pair the
  // targeted variant with an untargeted control. `targeting` only gates
  // eligibility for the experience as a whole; which variant an eligible
  // user lands in is then decided by deterministic traffic-split hash
  // bucketing (ab-test-experience.service.ts), NOT by the rule match. A
  // 50/50 split would only put a matching user in "Targeted" half the time,
  // so Control gets 0% - still present to satisfy the >=2 variant
  // requirement, but never actually reachable.
  // Unlike SegmentedVariant, ABTestVariant has no per-variant target - the
  // inline rules go on the version-level `targeting` field instead.
  const targetedVariant = variantManager.createInlineTargetABTestVariant('Targeted', 100);
  const controlVariant = variantManager.createABTestVariant('Control', 0);

  // CUSTOM_PERCENTAGE, not EQUALLY_SPLIT - EQUALLY_SPLIT makes the backend
  // normalize traffic back to an even split across variants, overriding the
  // 100/0 split this fixture depends on.
  const updated = await experienceManager.updateVersionedExperience(
    'DRAFT',
    [targetedVariant, controlVariant],
    experienceUid,
    versionUid,
    projectUid,
    'CUSTOM_PERCENTAGE',
    undefined,
    2,
    variantManager.targeting(target)
  );
  if (updated.isErr()) throw new Error('Failed to update A/B fixture experience');

  const activated = await experienceManager.activateExperience(updated.value, versionUid, experienceUid, projectUid, 2);
  if (activated.isErr()) throw new Error('Failed to activate A/B fixture experience');

  const paused = await experienceManager.pauseExperience(activated.value, versionUid, experienceUid, projectUid, 2);
  if (paused.isErr()) throw new Error('Failed to pause A/B fixture experience back to its resting state');

  const shortUid = await experienceManager.getShortUid(experienceUid, projectUid);
  if (shortUid.isErr()) throw new Error('Failed to fetch A/B fixture short uid');

  logger.success(`A/B fixture "${AB_TEST_EXPERIENCE_NAME}" provisioned (uid: ${experienceUid})`);
  return shortUid.value;
}

const config = ConfigService.getInstance();
const logger = LoggerService.getInstance();
setupInlineTargetingFixtures(config, logger).catch((error) => {
  logger.error('Failed to set up inline targeting fixtures:', error);
  process.exit(1);
});
