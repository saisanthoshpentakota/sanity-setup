import axios, { AxiosInstance } from 'axios';
import {
  err,
  ok,
  Result,
} from 'neverthrow';

import { ConfigService } from './config.service';
import { LoggerService } from './logger.service';
import { Audience } from '../types';


export class AudienceManager {
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

  async createAudience(
    name: string,
    description: string,
    definition: any,
    projectUid: string
  ): Promise<Result<Audience, Error>> {
    this.logger.log(`Creating ${name} audience...`);
    try {
      const result = await this.apiClient.post<Audience>(
        '/audiences',
        {
          name,
          description,
          definition,
        },
        {
          headers: {
            'X-Project-Uid': projectUid,
          },
        }
      );
      this.logger.success(`${name} audience created`);
      return ok(result.data);
    } catch (error: any) {
      this.logger.error(error);
      return err(error);
    }
  }

}
