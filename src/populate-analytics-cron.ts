import axios from 'axios';
import { LoggerService } from './services/logger.service';

const INTERVAL_MS = 60 * 1000; // 1 minute
const MIN_IMPRESSIONS = 100;
const MAX_IMPRESSIONS = 300;
const MIN_CONVERSION_RATE = 0.02; // 2%
const MAX_CONVERSION_RATE = 0.03; // 3%

const PROJECT_UID = '69a25f3de14fd30d1d5804c2';
const EVENT_KEY = 'click-cta';
const EDGE_API_URL = 'https://personalize-edge.contentstack.com/';
const EXP_SHORT_UID = '0';
const VARIANT_SHORT_UIDS = ['0', '1', '2'];

function generateRandomUid(): string {
  return Math.random().toString(36).substring(2, 15);
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomConversionRate(): number {
  return MIN_CONVERSION_RATE + Math.random() * (MAX_CONVERSION_RATE - MIN_CONVERSION_RATE);
}

async function populateForVariant(
  variantShortUid: string,
  edgeClient: ReturnType<typeof axios.create>,
  logger: LoggerService
): Promise<void> {
  const impressions = getRandomInt(MIN_IMPRESSIONS, MAX_IMPRESSIONS);
  const conversionRate = getRandomConversionRate();
  const conversions = Math.round(impressions * conversionRate);

  logger.log(
    `Variant ${variantShortUid}: ${impressions} impressions, ${conversions} conversions (${(conversionRate * 100).toFixed(1)}%)`
  );

  const promises: Promise<any>[] = [];

  for (let i = 0; i < impressions; i++) {
    const events: any[] = [
      {
        experienceShortUid: EXP_SHORT_UID,
        variantShortUid,
        type: 'IMPRESSION',
      },
    ];

    if (i < conversions) {
      events.push({
        eventKey: EVENT_KEY,
        type: 'EVENT',
      });
    }

    promises.push(
      edgeClient.post('/events', events, {
        headers: {
          'x-cs-personalize-user-uid': generateRandomUid(),
        },
      })
    );
  }

  try {
    await Promise.all(promises);
    logger.success(`  Done: ${impressions} impressions, ${conversions} conversions`);
  } catch (error: any) {
    logger.error(`  Failed for variant ${variantShortUid}`, error.message);
  }
}

async function main() {
  const logger = LoggerService.getInstance();

  const edgeClient = axios.create({
    baseURL: EDGE_API_URL,
    headers: {
      'x-project-uid': PROJECT_UID,
    },
  });

  logger.log(`Project: ${PROJECT_UID}`);
  logger.log(`Experience: ${EXP_SHORT_UID}`);
  logger.log(`Variants: ${VARIANT_SHORT_UIDS.join(', ')}`);
  logger.log(`Event key: ${EVENT_KEY}`);
  logger.log(`Impressions per variant: ${MIN_IMPRESSIONS}-${MAX_IMPRESSIONS}`);
  logger.log(`Conversion rate: ${MIN_CONVERSION_RATE * 100}-${MAX_CONVERSION_RATE * 100}%`);

  let tickCount = 0;

  async function tick() {
    tickCount++;
    const timestamp = new Date().toLocaleTimeString();
    logger.log(`\n--- Run #${tickCount} at ${timestamp} ---`);

    for (const variantShortUid of VARIANT_SHORT_UIDS) {
      await populateForVariant(variantShortUid, edgeClient, logger);
    }

    logger.success(`--- Run #${tickCount} complete ---`);
  }

  // Run immediately, then every 1 minute
  await tick();
  setInterval(tick, INTERVAL_MS);
  logger.log('\nRunning every 1 minute. Press Ctrl+C to stop.');
}

main().catch(console.error);
