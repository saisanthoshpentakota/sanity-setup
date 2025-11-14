import * as dotenv from 'dotenv';

dotenv.config();

export class ConfigService {
  private static instance: ConfigService;

  private constructor() {}

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  public getOrganizationUid(): string {
    return this.get('ORGANIZATION_UID');
  }

  public getAuthToken(): string {
    return this.get('AUTH_TOKEN');
  }

  public getApiUrl(): string {
    return this.get('API_URL');
  }

  public getEdgeApiUrl(): string { 
    return this.get('EDGE_API_URL');
  }

  public getLyticsAccountId(): string{
    return this.get('LYTICS_ACCOUNT_ID');
  }

  public getPersonalizeProjectId(): string{
    return this.get('PERSONALIZE_PROJECT_ID');
  }

  public getAnalyticsExpShortUid(): string {
    return this.getOptional('ANALYTICS_EXP_SHORT_UID', '0');
  }

  public getAnalyticsVariantShortUid(): string {
    return this.getOptional('ANALYTICS_VARIANT_SHORT_UID', '1');
  }

  public getAnalyticsEventKey(): string {
    return this.getOptional('ANALYTICS_EVENT_KEY', 'metric');
  }

  public getAnalyticsImpressions(): number {
    const value = this.getOptional('ANALYTICS_IMPRESSIONS', '100');
    return parseInt(value, 10);
  }

  public getAnalyticsConversions(): number {
    const value = this.getOptional('ANALYTICS_CONVERSIONS', '50');
    return parseInt(value, 10);
  }

  private get(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`${key} is not defined`);
    }

    return value;
  }

  private getOptional(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
  }
}
