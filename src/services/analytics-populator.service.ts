import axios, { AxiosInstance } from 'axios';
import { LoggerService } from './logger.service';
import { ConfigService } from './config.service';


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

  async populateAnalytics(eventKey: string): Promise<void> {
    this.logger.log('Populating analytics...');
    let promises: any = [];

    for (let i = 0; i < 100; i++) {
      promises.push(
        this.apiClient.post(
          '/events',
          [
            {
              experienceShortUid: '1',
              variantShortUid: '1',
              type: 'IMPRESSION',
            },
            {
              eventKey: eventKey,
              type: 'EVENT',
            },
          ],
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

      this.logger.success('Analytics populated');
    } catch (error: any) {
      this.logger.error(error);
    }
  }

  private triggerEvent(eventKey: string): void { }

  private generateRandomUid(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}
