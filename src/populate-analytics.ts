import { AnalyticsPopulator } from './services/analytics-populator.service';
import { ConfigService } from './services/config.service';
import { LoggerService } from './services/logger.service';

const EXP_SHORT_UID = '0'; //experience shortUID
const VARIANT_SHORT_UID = '1'; // variant shortUID
const EVENT_KEY = 'metric'; // ignore this if only populating impressions
const IMPRESSIONS = 100; // number of impressions to populate
const CONVERSIONS = 50; //ignore this if only populating impressions

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

populateAnalytics(EVENT_KEY, IMPRESSIONS, CONVERSIONS, EXP_SHORT_UID, VARIANT_SHORT_UID);
