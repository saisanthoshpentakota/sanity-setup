import axios, { AxiosInstance } from 'axios';
import {
  err,
  ok,
  Result,
} from 'neverthrow';

import { ConfigService } from './config.service';
import { LoggerService } from './logger.service';
import { Attribute } from './types';

export class AttributeManager {
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

  async createAttribute(
    key: string,
    name: string,
    description: string,
    projectUid: string
  ): Promise<Result<Attribute, Error>> {
    this.logger.log(`Creating ${name} attribute...`);
    try {
      const result = await this.apiClient.post<Attribute>(
        '/attributes',
        {
          key,
          name,
          description,
        },
        {
          headers: {
            'X-Project-Uid': projectUid,
          },
        }
      );
      this.logger.success(`${name} attribute created`);
      return ok(result.data);
    } catch (error: any) {
      this.logger.error(error);
      return err(error);
    }
  }
}
