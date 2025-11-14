import { AnalyticsPopulator } from './services/analytics-populator.service';
import { ConfigService } from './services/config.service';
import { LoggerService } from './services/logger.service';

async function populateAnalytics(
  eventKey: string,
  impressions: number = 100,
  conversions: number = 0,
  experienceShortUid: string,
  variantShortUid: string
) {
  const config = ConfigService.getInstance();
  const logger = LoggerService.getInstance();
  const projectUid = config.getPersonalizeProjectId();

  logger.log(`Starting analytics population for project: ${projectUid}`);
  logger.log(`Event Key: ${eventKey}`);
  logger.log(`Impressions: ${impressions}`);
  logger.log(`Conversions: ${conversions}`);

  const analyticsPopulator = new AnalyticsPopulator(projectUid, logger, config);

  await analyticsPopulator.populateAnalytics(eventKey, impressions, conversions, experienceShortUid, variantShortUid);
}

const config = ConfigService.getInstance();
const eventKey = config.getAnalyticsEventKey();
const impressions = config.getAnalyticsImpressions();
const conversions = config.getAnalyticsConversions();
const expShortUid = config.getAnalyticsExpShortUid();
const variantShortUid = config.getAnalyticsVariantShortUid();

populateAnalytics(eventKey, impressions, conversions, expShortUid, variantShortUid);
