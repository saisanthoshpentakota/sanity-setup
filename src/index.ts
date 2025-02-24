import { AnalyticsPopulator } from './analytics-populator.service';
import { AttributeManager } from './attribute-manager.service';
import { AudienceManager } from './audience-manager.service';
import { ConfigService } from './config.service';
import { EventManager } from './event-manager.service';
import { ExperienceManager } from './experience-manager.service';
import {
  ShortUsCitizen,
  TallUsCitizen,
} from './helpers';
import { LoggerService } from './logger.service';
import { MetricManager } from './metric-manager.service';
import { ProjectManager } from './project-manager.service';
import { VariantManager } from './variant-manager.service';

async function setupSanity(logger: LoggerService, config: ConfigService) {
  logger.log('Setting up sanity...');

  const projectManager = new ProjectManager(logger, config);
  const eventManager = new EventManager(logger, config);
  const attributeManager = new AttributeManager(logger, config);
  const audienceManager = new AudienceManager(logger, config);
  const experienceManager = new ExperienceManager(logger, config);
  const variantManager = new VariantManager();
  const metricManager = new MetricManager();
  
  const project = await projectManager.createProject('automating sanity-test-145', 'this is a test');
  if (project.isErr()) return;
  const projectUid = project.value.uid;

  const event = await eventManager.createEvent('checkout', 'defines checkout event', projectUid);
  if (event.isErr()) return;
  const eventUid = event.value.uid;

  const attribute = await attributeManager.createAttribute(
    'height',
    'height',
    'defines height of the audience',
    projectUid
  );
  if (attribute.isErr()) return;
  const attributeUid = attribute.value.uid;

  const tallAudienceData = TallUsCitizen(attributeUid);
  const tallAudience = await audienceManager.createAudience(
    tallAudienceData.name,
    tallAudienceData.description,
    tallAudienceData.definition,
    projectUid
  );
  if (tallAudience.isErr()) return;

  const tallAudienceUid = tallAudience.value.uid;

  const shortAudienceData = ShortUsCitizen(attributeUid);
  const shortAudience = await audienceManager.createAudience(
    shortAudienceData.name,
    shortAudienceData.description,
    shortAudienceData.definition,
    projectUid
  );
  if (shortAudience.isErr()) return;

  const shortAudienceUid = shortAudience.value.uid;

  const segmentedExperience = await experienceManager.createExperience('Shoe Plaze', '', 'SEGMENTED', projectUid);
  if (segmentedExperience.isErr()) return;
  const segmentedExperienceUid = segmentedExperience.value.uid;

  const segmentedDraftExperienceResult = await experienceManager.fetchDraftVersion(segmentedExperienceUid, projectUid);
  if (segmentedDraftExperienceResult.isErr()) return;
  const segmentedDraftExperienceUid = segmentedDraftExperienceResult.value.uid;

  const recommenedJordanVariant = variantManager.createSegmentedVariant('Recommend Jordan', 'AND', [tallAudienceUid]);
  const recommendNikeVariant = variantManager.createSegmentedVariant('Recommend Nike Airforce', 'AND', [
    shortAudienceUid,
  ]);

  const updateSegmentedExperienceResult = await experienceManager.updateVersionedExperience(
    'DRAFT',
    [recommenedJordanVariant, recommendNikeVariant],
    segmentedExperienceUid,
    segmentedDraftExperienceUid,
    projectUid
  );
  if (updateSegmentedExperienceResult.isErr()) return;

  const activateExperienceResult = await experienceManager.activateExperience(
    updateSegmentedExperienceResult.value,
    segmentedDraftExperienceUid,
    segmentedExperienceUid,
    projectUid
  );
  if (activateExperienceResult.isErr()) return;

  const pauseSegmentedExperienceResult = await experienceManager.pauseExperience(
    activateExperienceResult.value,
    segmentedDraftExperienceUid,
    segmentedExperienceUid,
    projectUid
  );
  if (pauseSegmentedExperienceResult.isErr()) return;

  const abTestExperience = await experienceManager.createExperience('Special Offer', '', 'AB_TEST', projectUid);
  if (abTestExperience.isErr()) return;
  const abTestExperienceUid = abTestExperience.value.uid;

  const abTestDraftExperienceResult = await experienceManager.fetchDraftVersion(abTestExperienceUid, projectUid);
  if (abTestDraftExperienceResult.isErr()) return;
  const abTestDraftExperienceUid = abTestDraftExperienceResult.value.uid;

  const fiftyPercentOfferVariant = variantManager.createABTestVariant('50% Offer', 50);
  const buyOneGetOneVariant = variantManager.createABTestVariant('Buy One Get One', 50);
  const checkoutMetric = metricManager.createMetric('checkout', eventUid);

  const updateAbTestExperienceResult = await experienceManager.updateVersionedExperience(
    'DRAFT',
    [buyOneGetOneVariant, fiftyPercentOfferVariant],
    abTestExperienceUid,
    abTestDraftExperienceUid,
    projectUid,
    "EQUALLY_SPLIT",
    [checkoutMetric]
  );

  if (updateAbTestExperienceResult.isErr()) return;

  const updatedAbTestExperience = updateAbTestExperienceResult.value;

  const activateAbTestExperienceResult = await experienceManager.activateExperience(
    updatedAbTestExperience,
    abTestDraftExperienceUid,
    abTestExperienceUid,
    projectUid
  );
  if (activateAbTestExperienceResult.isErr()) return;

  const analyticsPopulator = new AnalyticsPopulator(projectUid, logger, config);
  await analyticsPopulator.populateAnalytics('checkout');

  logger.success('Sanity setup complete');
}

const logger = LoggerService.getInstance();
const config = ConfigService.getInstance();

setupSanity(logger, config);
