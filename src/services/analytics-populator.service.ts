import axios, { AxiosInstance } from 'axios';

import { ConfigService } from './config.service';
import { LoggerService } from './logger.service';

export class AnalyticsPopulator {
  private apiClient: AxiosInstance;

  constructor(projectUid: string, private logger: LoggerService, private config: ConfigService) {
    this.apiClient = axios.create({
      baseURL: config.getEdgeApiUrl(),
      headers: {
        'x-cs-personalize-user-uid': 'mock-user-uid',
        'x-project-uid': projectUid,
      },
    });
  }

  async populateAnalytics(
    eventKey: string, 
    impressions: number = 100,
    conversions: number = 0,
    experienceShortUid: string = '0',
    variantShortUid: string = '0'
  ): Promise<void> {
    this.logger.log(`Populating analytics with ${impressions} impressions and ${conversions} conversions...`);
    let promises: any = [];

    for (let i = 0; i < impressions; i++) {
      const events: any[] = [
        {
          experienceShortUid,
          variantShortUid,
          type: 'IMPRESSION',
        },
      ];

      if (i < conversions) {
        events.push({
          eventKey: eventKey,
          type: 'EVENT',
        });
      }

      promises.push(
        this.apiClient.post(
          '/events',
          events,
          {
            headers: {
              'x-cs-personalize-user-uid': this.generateRandomUid(),
            },
          }
        )
      );
    }
    try {
      await Promise.all(promises);

      this.logger.success(`Analytics populated with ${impressions} impressions and ${conversions} conversions`);
    } catch (error: any) {
      this.logger.error(error);
    }
  }

  private generateRandomUid(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}
