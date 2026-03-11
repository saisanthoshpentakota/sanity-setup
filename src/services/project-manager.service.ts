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

  async listProjects(): Promise<Result<Project[], Error>> {
    this.logger.log('Fetching existing projects...');
    try {
      const result = await this.apiClient.get<Project[]>('/projects');
      return ok(result.data);
    } catch (error: any) {
      this.logger.error(error);
      return err(error);
    }
  }

  async findProjectByName(name: string): Promise<Result<Project | null, Error>> {
    const projectsResult = await this.listProjects();
    if (projectsResult.isErr()) return err(projectsResult.error);

    const match = projectsResult.value.find((p) => p.name === name);
    return ok(match ?? null);
  }

  async ensureProject(name: string, description: string, connectedStackApiKey?: string): Promise<Result<Project, Error>> {
    this.logger.log(`Ensuring project "${name}" exists...`);

    const existing = await this.findProjectByName(name);
    if (existing.isErr()) return err(existing.error);

    if (existing.value) {
      this.logger.success(`Project "${name}" already exists (uid: ${existing.value.uid})`);
      return ok({ ...existing.value, _existed: true });
    }

    return this.createProject(name, description, connectedStackApiKey);
  }

  async createProject(name: string, description: string, connectedStackApiKey?: string): Promise<Result<Project, Error>> {
    this.logger.log(`Creating project "${name}"...`);
    try {
      const body: Record<string, string> = { name, description };
      if (connectedStackApiKey) {
        body.connectedStackApiKey = connectedStackApiKey;
      }
      const result = await this.apiClient.post<Project>('/projects', body);
      this.logger.success(`Project created: ${name} (uid: ${result.data.uid})`);

      return ok({ ...result.data, _existed: false });
    } catch (error: any) {
      this.logger.error(error);
      return err(error);
    }
  }
}
