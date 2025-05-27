import { ConfigService } from './services/config.service';
import { LoggerService } from './services/logger.service';
import { SanitySetupService } from './services/sanity-setup.service';

async function main() {
  const logger = LoggerService.getInstance();
  const config = ConfigService.getInstance();
  const sanitySetup = new SanitySetupService(logger, config);

  try {
    await sanitySetup.setup();
  } catch (error) {
    logger.error('Failed to setup sanity:', error);
    process.exit(1);
  }
}

main();
