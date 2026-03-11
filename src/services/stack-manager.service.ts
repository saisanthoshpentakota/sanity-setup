import axios, { AxiosInstance } from 'axios';
import {
  err,
  ok,
  Result,
} from 'neverthrow';

import { ConfigService } from './config.service';
import { LoggerService } from './logger.service';
import { Stack } from '../types';

export class StackManager {
  private apiClient: AxiosInstance;

  constructor(private readonly logger: LoggerService, private readonly config: ConfigService) {
    const baseUrl = this.config.getCmsApiUrl();

    this.apiClient = axios.create({
      baseURL: baseUrl,
      headers: {
        organization_uid: this.config.getOrganizationUid(),
        authtoken: this.config.getAuthToken(),
        'Content-Type': 'application/json',
      },
    });
  }

  async createStack(name: string, description: string): Promise<Result<Stack, Error>> {
    this.logger.log('Creating stack...');
    try {
      const result = await this.apiClient.post<{ stack: Stack }>('/v3/stacks', {
        stack: { name, description },
      });
      this.logger.success(`Stack created: ${result.data.stack.name}`);

      return ok(result.data.stack);
    } catch (error: any) {
      this.logger.error(error);
      return err(error);
    }
  }
}
