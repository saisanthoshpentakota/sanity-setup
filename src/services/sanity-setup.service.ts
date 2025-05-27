import { AnalyticsPopulator } from './analytics-populator.service';
import { AttributeManager } from './attribute-manager.service';
import { AudienceManager } from './audience-manager.service';
import { ConfigService } from './config.service';
import { EventManager } from './event-manager.service';
import { ExperienceManager } from './experience-manager.service';
import { LoggerService } from './logger.service';
import { MetricManager } from './metric-manager.service';
import { ProjectManager } from './project-manager.service';
import { VariantManager } from '../variant-manager.service';
import { ShortUsCitizen, TallUsCitizen } from '../lib/helpers';

export class SanitySetupService {
  private projectManager: ProjectManager;
  private eventManager: EventManager;
  private attributeManager: AttributeManager;
  private audienceManager: AudienceManager;
  private experienceManager: ExperienceManager;
  private variantManager: VariantManager;
  private metricManager: MetricManager;
  private analyticsPopulator!: AnalyticsPopulator;

  constructor(
    private readonly logger: LoggerService,
    private readonly config: ConfigService
  ) {
    this.projectManager = new ProjectManager(logger, config);
    this.eventManager = new EventManager(logger, config);
    this.attributeManager = new AttributeManager(logger, config);
    this.audienceManager = new AudienceManager(logger, config);
    this.experienceManager = new ExperienceManager(logger, config);
    this.variantManager = new VariantManager();
    this.metricManager = new MetricManager();
  }

  async setup(): Promise<void> {
    this.logger.log('Setting up sanity...');

    const projectUid = await this.setupProject();
    const eventUid = await this.setupEvent(projectUid);
    const attributeUid = await this.setupAttribute(projectUid);
    const { tallAudienceUid, shortAudienceUid } = await this.setupAudiences(attributeUid, projectUid);

    await this.setupSegmentedExperience(projectUid, tallAudienceUid, shortAudienceUid);
    await this.setupABTestExperience(projectUid, eventUid);
    await this.populateAnalytics(projectUid);

    this.logger.success('Sanity setup complete');
  }

  private async setupProject(): Promise<string> {
    const project = await this.projectManager.createProject('automating sanity-test-asdasda', 'this is a test');
    if (project.isErr()) throw new Error('Failed to create project');
    return project.value.uid;
  }

  private async setupEvent(projectUid: string): Promise<string> {
    const event = await this.eventManager.createEvent('checkout', 'defines checkout event', projectUid);
    if (event.isErr()) throw new Error('Failed to create event');
    return event.value.uid;
  }

  private async setupAttribute(projectUid: string): Promise<string> {
    const attribute = await this.attributeManager.createAttribute(
      'height',
      'height',
      'defines height of the audience',
      projectUid
    );
    if (attribute.isErr()) throw new Error('Failed to create attribute');
    return attribute.value.uid;
  }

  private async setupAudiences(attributeUid: string, projectUid: string): Promise<{ tallAudienceUid: string; shortAudienceUid: string }> {
    const tallAudienceData = TallUsCitizen(attributeUid);
    const tallAudience = await this.audienceManager.createAudience(
      tallAudienceData.name,
      tallAudienceData.description,
      tallAudienceData.definition,
      projectUid
    );
    if (tallAudience.isErr()) throw new Error('Failed to create tall audience');

    const shortAudienceData = ShortUsCitizen(attributeUid);
    const shortAudience = await this.audienceManager.createAudience(
      shortAudienceData.name,
      shortAudienceData.description,
      shortAudienceData.definition,
      projectUid
    );
    if (shortAudience.isErr()) throw new Error('Failed to create short audience');

    return {
      tallAudienceUid: tallAudience.value.uid,
      shortAudienceUid: shortAudience.value.uid
    };
  }

  private async setupSegmentedExperience(projectUid: string, tallAudienceUid: string, shortAudienceUid: string): Promise<void> {
    const segmentedExperience = await this.experienceManager.createExperience('Shoe Plaze', '', 'SEGMENTED', projectUid);
    if (segmentedExperience.isErr()) throw new Error('Failed to create segmented experience');
    const segmentedExperienceUid = segmentedExperience.value.uid;

    const segmentedDraftExperienceResult = await this.experienceManager.fetchDraftVersion(segmentedExperienceUid, projectUid);
    if (segmentedDraftExperienceResult.isErr()) throw new Error('Failed to fetch draft version');
    const segmentedDraftExperienceUid = segmentedDraftExperienceResult.value.uid;

    const recommenedJordanVariant = this.variantManager.createSegmentedVariant('Recommend Jordan', 'AND', [tallAudienceUid]);
    const recommendNikeVariant = this.variantManager.createSegmentedVariant('Recommend Nike Airforce', 'AND', [shortAudienceUid]);

    const updateSegmentedExperienceResult = await this.experienceManager.updateVersionedExperience(
      'DRAFT',
      [recommenedJordanVariant, recommendNikeVariant],
      segmentedExperienceUid,
      segmentedDraftExperienceUid,
      projectUid
    );
    if (updateSegmentedExperienceResult.isErr()) throw new Error('Failed to update segmented experience');

    const activateExperienceResult = await this.experienceManager.activateExperience(
      updateSegmentedExperienceResult.value,
      segmentedDraftExperienceUid,
      segmentedExperienceUid,
      projectUid
    );
    if (activateExperienceResult.isErr()) throw new Error('Failed to activate segmented experience');

    const pauseSegmentedExperienceResult = await this.experienceManager.pauseExperience(
      activateExperienceResult.value,
      segmentedDraftExperienceUid,
      segmentedExperienceUid,
      projectUid
    );
    if (pauseSegmentedExperienceResult.isErr()) throw new Error('Failed to pause segmented experience');
  }

  private async setupABTestExperience(projectUid: string, eventUid: string): Promise<void> {
    const abTestExperience = await this.experienceManager.createExperience('Special Offer', '', 'AB_TEST', projectUid);
    if (abTestExperience.isErr()) throw new Error('Failed to create AB test experience');
    const abTestExperienceUid = abTestExperience.value.uid;

    const abTestDraftExperienceResult = await this.experienceManager.fetchDraftVersion(abTestExperienceUid, projectUid);
    if (abTestDraftExperienceResult.isErr()) throw new Error('Failed to fetch AB test draft version');
    const abTestDraftExperienceUid = abTestDraftExperienceResult.value.uid;

    const fiftyPercentOfferVariant = this.variantManager.createABTestVariant('50% Offer', 50);
    const buyOneGetOneVariant = this.variantManager.createABTestVariant('Buy One Get One', 50);
    const checkoutMetric = this.metricManager.createMetric('checkout', eventUid);

    const updateAbTestExperienceResult = await this.experienceManager.updateVersionedExperience(
      'DRAFT',
      [buyOneGetOneVariant, fiftyPercentOfferVariant],
      abTestExperienceUid,
      abTestDraftExperienceUid,
      projectUid,
      "EQUALLY_SPLIT",
      [checkoutMetric]
    );
    if (updateAbTestExperienceResult.isErr()) throw new Error('Failed to update AB test experience');

    const activateAbTestExperienceResult = await this.experienceManager.activateExperience(
      updateAbTestExperienceResult.value,
      abTestDraftExperienceUid,
      abTestExperienceUid,
      projectUid
    );
    if (activateAbTestExperienceResult.isErr()) throw new Error('Failed to activate AB test experience');
  }

  private async populateAnalytics(projectUid: string): Promise<void> {
    this.analyticsPopulator = new AnalyticsPopulator(projectUid, this.logger, this.config);
    await this.analyticsPopulator.populateAnalytics('checkout');
  }
} 