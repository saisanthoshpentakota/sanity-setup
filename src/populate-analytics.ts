import { AnalyticsPopulator } from './services/analytics-populator.service';
import { ConfigService } from './services/config.service';
import { LoggerService } from './services/logger.service';

const PROJECT_UID = '6912f71022c7cad7bc578750';
const EXP_SHORT_UID = '0';
const VARIANT_SHORT_UID = '1';
const EVENT_KEY = 'metric';
const IMPRESSIONS = 100;
const CONVERSIONS = 50;

async function populateAnalytics(
  projectUid: string,
  eventKey: string,
  impressions: number = 100,
  conversions: number = 0,
  experienceShortUid: string,
  variantShortUid: string
) {
  const config = ConfigService.getInstance();
  const logger = LoggerService.getInstance();

  logger.log(`Starting analytics population for project: ${projectUid}`);
  logger.log(`Event Key: ${eventKey}`);
  logger.log(`Impressions: ${impressions}`);
  logger.log(`Conversions: ${conversions}`);

  const analyticsPopulator = new AnalyticsPopulator(projectUid, logger, config);

  await analyticsPopulator.populateAnalytics(eventKey, impressions, conversions, experienceShortUid, variantShortUid);
}

populateAnalytics(PROJECT_UID, EVENT_KEY, IMPRESSIONS, CONVERSIONS, EXP_SHORT_UID, VARIANT_SHORT_UID);
