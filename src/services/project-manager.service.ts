import axios, { AxiosInstance } from 'axios';
import {
  err,
  ok,
  Result,
} from 'neverthrow';

import { ConfigService } from './config.service';
import { LoggerService } from './logger.service';
import { Project } from '../types';

export class ProjectManager {
  private apiClient: AxiosInstance;

  constructor(private readonly logger: LoggerService, private readonly config: ConfigService) {
    const baseUrl = this.config.getApiUrl();

    this.apiClient = axios.create({
      baseURL: baseUrl,
      headers: {
        Organization_uid: this.config.getOrganizationUid(),
        Authtoken: this.config.getAuthToken(),
      },
    });
  }

  async createProject(name: string, description: string, connectedStackApiKey?: string): Promise<Result<Project, Error>> {
    this.logger.log('Creating project...');
    try {
      const body: Record<string, string> = { name, description };
      if (connectedStackApiKey) {
        body.connectedStackApiKey = connectedStackApiKey;
      }
      const result = await this.apiClient.post<Project>('/projects', body);
      this.logger.success('Project created');

      return ok(result.data);
    } catch (error: any) {
      this.logger.error(error);
      return err(error);
    }
  }
}
