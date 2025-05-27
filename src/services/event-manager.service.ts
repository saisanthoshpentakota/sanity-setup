import axios, { AxiosInstance } from 'axios';
import {
  err,
  ok,
  Result,
} from 'neverthrow';

import { ConfigService } from './config.service';
import { LoggerService } from './logger.service';
import { Event } from '../types';

export class EventManager {
  private apiClient: AxiosInstance;
  constructor(private logger: LoggerService, private config: ConfigService) {
    this.apiClient = axios.create({
      baseURL: this.config.getApiUrl(),
      headers: {
        Organization_uid: this.config.getOrganizationUid(),
        Authtoken: this.config.getAuthToken(),
      },
    });
  }

  async createEvent(key: string, description: string, projectUid: string): Promise<Result<Event, Error>> {
    this.logger.log(`Creating ${key} event...`);
    try {
      const result = await this.apiClient.post<Event>(
        '/events',
        { key, description },
        {
          headers: {
            'X-Project-Uid': projectUid,
          },
        }
      );
      this.logger.success(`${key} event created`);
      return ok(result.data);
    } catch (error: any) {
      this.logger.error(error);
      return err(error);
    }
  }
}
