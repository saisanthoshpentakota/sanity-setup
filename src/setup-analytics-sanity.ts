import { ConfigService } from "./services/config.service";
import { EventManager } from "./services/event-manager.service";
import { ExperienceManager } from "./services/experience-manager.service";
import { LoggerService } from "./services/logger.service";
import { MetricManager } from "./services/metric-manager.service";
import { ProjectManager } from "./services/project-manager.service";
import { VariantManager } from "./variant-manager.service";

;

async function setupSanity(config: ConfigService, logger: LoggerService) {
  logger.log('Setting up sanity...');
  const projectManager = new ProjectManager(logger, config);
  const experienceManager = new ExperienceManager(logger, config);
  const eventManager = new EventManager(logger, config);
  const variantManager = new VariantManager();
  const metricManager = new MetricManager();

  const project = await projectManager.createProject('Analytics happy path sanity', '');
  if (project.isErr()) return;

  const projectUid = project.value.uid;

  const createEventResult = await eventManager.createEvent('checkout', '', projectUid);
  if (createEventResult.isErr()) return;
  const eventUid = createEventResult.value.uid;

  const createAbTestExpResult = await experienceManager.createExperience(
    'Test | Analytics Flow',
    '',
    'AB_TEST',
    projectUid
  );
  if (createAbTestExpResult.isErr()) return;
  const abTestExpUid = createAbTestExpResult.value.uid;

  const firstVariant = variantManager.createABTestVariant('Variant 1', 50);
  const secondVariant = variantManager.createABTestVariant('Variant 2', 50);

  const abTestExpDraftVersionResult = await experienceManager.fetchDraftVersion(abTestExpUid, projectUid);
  if (abTestExpDraftVersionResult.isErr()) return;
  const abTestExpDraftUid = abTestExpDraftVersionResult.value.uid;

  const metric = metricManager.createMetric('checkout', eventUid);
  const updateAbTestExperienceResult = await experienceManager.updateVersionedExperience(
    'DRAFT',
    [firstVariant, secondVariant],
    abTestExpUid,
    abTestExpDraftUid,
    projectUid,
    'EQUALLY_SPLIT',
    [metric]
  );
  if (updateAbTestExperienceResult.isErr()) return;

  const activateAbTestExperienceResult = await experienceManager.activateExperience(
    updateAbTestExperienceResult.value,
    abTestExpDraftUid,
    abTestExpUid,
    projectUid
  );
  if (activateAbTestExperienceResult.isErr()) return;

  logger.success('Sanity setup completed');
}

const config = ConfigService.getInstance();
const logger = LoggerService.getInstance();
setupSanity(config, logger);
