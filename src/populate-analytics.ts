import { AnalyticsPopulator } from './services/analytics-populator.service';
import { ConfigService } from './services/config.service';
import { LoggerService } from './services/logger.service';
import { ProjectManager } from './services/project-manager.service';

async function populateAnalytics() {
  const config = ConfigService.getInstance();
  const logger = LoggerService.getInstance();

  const projectName = config.getAnalyticsProjectName();
  const projectManager = new ProjectManager(logger, config);
  const projectResult = await projectManager.findProjectByName(projectName);

  if (projectResult.isErr() || !projectResult.value) {
    logger.error(`Project "${projectName}" not found. Set ANALYTICS_PROJECT_NAME in .env to an existing project name.`);
    process.exit(1);
  }

  const projectUid = projectResult.value.uid;
  const eventKey = config.getAnalyticsEventKey();
  const impressions = config.getAnalyticsImpressions();
  const conversions = config.getAnalyticsConversions();
  const expShortUid = config.getAnalyticsExpShortUid();
  const variantShortUid = config.getAnalyticsVariantShortUid();

  logger.log(`Starting analytics population for project: ${projectName} (${projectUid})`);
  logger.log(`Event Key: ${eventKey}`);
  logger.log(`Impressions: ${impressions}`);
  logger.log(`Conversions: ${conversions}`);

  const analyticsPopulator = new AnalyticsPopulator(projectUid, logger, config);
  await analyticsPopulator.populateAnalytics(eventKey, impressions, conversions, expShortUid, variantShortUid);
}

populateAnalytics();
