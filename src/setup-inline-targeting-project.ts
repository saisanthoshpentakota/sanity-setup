import { PROJECT_NAME } from './inline-targeting.constants';
import { ConfigService } from './services/config.service';
import { LoggerService } from './services/logger.service';
import { ProjectManager } from './services/project-manager.service';

// ECL-2252: standalone step that ensures the standing project used by the
// v2 inline-targeting e2e test exists. Run this before
// setup-inline-targeting-fixtures, which populates the project's data.

async function setupInlineTargetingProject(config: ConfigService, logger: LoggerService): Promise<void> {
  logger.log('Setting up inline targeting project (ECL-2252)...');

  const projectManager = new ProjectManager(logger, config);

  // Reuses the sanity org's existing Lytics account connection - no new
  // org, no new Lytics account/integration, just a new project.
  const project = await projectManager.ensureProject(
    PROJECT_NAME,
    "Standing fixtures for the v2 inline-targeting e2e test (ECL-2252)."
  );
  if (project.isErr()) throw new Error(`Failed to ensure project "${PROJECT_NAME}"`);

  logger.success(`Project "${PROJECT_NAME}" ready (uid: ${project.value.uid})`);
}

const config = ConfigService.getInstance();
const logger = LoggerService.getInstance();
setupInlineTargetingProject(config, logger).catch((error) => {
  logger.error('Failed to set up inline targeting project:', error);
  process.exit(1);
});
