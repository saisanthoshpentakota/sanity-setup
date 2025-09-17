import { AudienceManager } from './services/audience-manager.service';
import { ConfigService } from './services/config.service';
import { ExperienceManager } from './services/experience-manager.service';
import { LoggerService } from './services/logger.service';
import { VariantManager } from './variant-manager.service';

async function main() {
  const configService = ConfigService.getInstance();
  const loggerService = LoggerService.getInstance();
  const audienceManager = new AudienceManager(loggerService, configService);
  const experienceManger = new ExperienceManager(loggerService, configService);
  const variantManager = new VariantManager();

  const projectId = configService.getPersonalizeProjectId();

  const audiencesResult = await audienceManager.fetchAudiences(projectId);

  if (audiencesResult.isErr()) {
    loggerService.error('audience result failed', audiencesResult.error);
    return;
  }

  const audiences = audiencesResult.value;

  const allAudience = audiences.find((audience) => {
    return audience.source?.toLowerCase() === 'lytics' && audience.name.toLowerCase() === 'all';
  });

  if (!allAudience) {
    loggerService.error('No all audience found in audiences list');
    return;
  }

  const allAudienceId = allAudience.uid;


  const createExpResult = await experienceManger.createExperience('Lytics Audience Offer', '', 'SEGMENTED', projectId);

  if (createExpResult.isErr()) {
    loggerService.error('failed to create exp', createExpResult.error);
    return;
  }

  const expId = createExpResult.value.uid;

  const fetchDraftExpsResult = await experienceManger.fetchDraftVersion(expId, projectId);

  if (fetchDraftExpsResult.isErr()) {
    loggerService.error(fetchDraftExpsResult.error.message);
    return;
  }

  const versionId = fetchDraftExpsResult.value.uid;

  const offerVariant = variantManager.createSegmentedVariant('offer', 'AND', [], [allAudienceId]);

  const updateVersionResult = await experienceManger.updateVersionedExperience(
    'DRAFT',
    [offerVariant],
    expId,
    versionId,
    projectId
  );

  if (updateVersionResult.isErr()) {
    loggerService.error('failed to update version', updateVersionResult.error);
    return;
  }

  const activateExperienceResult = await experienceManger.activateExperience(
    updateVersionResult.value,
    versionId,
    expId,
    projectId
  );

  if (activateExperienceResult.isErr()) {
    loggerService.error('failed to activate exp', activateExperienceResult.error);
    return;
  }

  loggerService.success('Exp is Setup');

  const shortUidResult = await experienceManger.getShortUid(expId, projectId);

  if (shortUidResult.isErr()) {
    loggerService.error('failed to fetch shortUid', shortUidResult.error);
    return;
  }

  loggerService.success(`Exp Short Uid: ${shortUidResult.value}`)
}

main();
