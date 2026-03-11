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

  async listStacks(): Promise<Result<Stack[], Error>> {
    this.logger.log('Fetching existing stacks...');
    try {
      const result = await this.apiClient.get<{ stacks: Stack[] }>('/v3/stacks');
      return ok(result.data.stacks);
    } catch (error: any) {
      this.logger.error(error);
      return err(error);
    }
  }

  async findStackByName(name: string): Promise<Result<Stack | null, Error>> {
    const stacksResult = await this.listStacks();
    if (stacksResult.isErr()) return err(stacksResult.error);

    const match = stacksResult.value.find((s) => s.name === name);
    return ok(match ?? null);
  }

  async ensureStack(name: string, description: string): Promise<Result<Stack, Error>> {
    this.logger.log(`Ensuring stack "${name}" exists...`);

    const existing = await this.findStackByName(name);
    if (existing.isErr()) return err(existing.error);

    if (existing.value) {
      this.logger.success(`Stack "${name}" already exists (api_key: ${existing.value.api_key})`);
      return ok({ ...existing.value, _existed: true });
    }

    return this.createStack(name, description);
  }

  async createStack(name: string, description: string): Promise<Result<Stack, Error>> {
    this.logger.log(`Creating stack "${name}"...`);
    try {
      const result = await this.apiClient.post<{ stack: Stack }>('/v3/stacks', {
        stack: { name, description },
      });
      this.logger.success(`Stack created: ${result.data.stack.name} (api_key: ${result.data.stack.api_key})`);

      return ok({ ...result.data.stack, _existed: false });
    } catch (error: any) {
      this.logger.error(error);
      return err(error);
    }
  }
}
