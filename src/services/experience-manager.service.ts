import axios, { AxiosInstance } from 'axios';
import {
  err,
  ok,
  Result,
} from 'neverthrow';

import {
  Experience,
  ExperienceVersion,
  Metric,
} from '../types';
import { ConfigService } from './config.service';
import { LoggerService } from './logger.service';

export class ExperienceManager {
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

  async createExperience(
    name: string,
    description: string,
    type: 'SEGMENTED' | 'AB_TEST',
    projectUid: string
  ): Promise<Result<Experience, Error>> {
    this.logger.log(`Creating ${name} experience...`);
    try {
      const result = await this.apiClient.post<Experience>(
        '/experiences',
        {
          name,
          description,
          __type: type,
        },
        {
          headers: {
            'X-Project-Uid': projectUid,
          },
        }
      );

      this.logger.success(`${name} experience created`);
      return ok(result.data);
    } catch (error: any) {
      this.logger.error(error);
      return err(error);
    }
  }

  async fetchDraftVersion(experienceUid: string, projectUid: string): Promise<Result<ExperienceVersion, Error>> {
    const versionsResult = await this.fetchExperienceVersions(experienceUid, projectUid);
    if (versionsResult.isErr()) {
      return err(versionsResult.error);
    }

    const versions = versionsResult.value;
    const draftVersion = versions.find((version) => version.status === 'DRAFT');

    return draftVersion ? ok(draftVersion) : err(new Error('Draft version not found'));
  }

  async updateVersionedExperience(
    status: ExperienceVersion['status'],
    variants: ExperienceVersion['variants'],
    experienceUid: string,
    versionUid: string,
    projectUid: string,
    variantSplit?: string,
    metrics?: Metric[]
  ): Promise<Result<ExperienceVersion, Error>> {
    this.logger.log(`Updating experience version...`);
    try {
      const result = await this.apiClient.put<ExperienceVersion>(
        `/experiences/${experienceUid}/versions/${versionUid}`,
        {
          status,
          variants,
          variantSplit,
          metrics,
        },
        {
          headers: {
            'X-Project-Uid': projectUid,
          },
        }
      );

      this.logger.success(`Experience version updated`);
      return ok(result.data);
    } catch (error: any) {
      this.logger.error(error);
      return err(error);
    }
  }

  async pauseExperience(
    versionedExperience: ExperienceVersion,
    versionUid: string,
    experienceUid: string,
    projectUid: string
  ): Promise<Result<ExperienceVersion, Error>> {
    this.logger.log(`Pausing experience...`);
    try {
      const result = await this.apiClient.put<ExperienceVersion>(
        `/experiences/${experienceUid}/versions/${versionUid}`,
        {
          ...versionedExperience,
          status: 'PAUSED',
        },
        {
          headers: {
            'X-Project-Uid': projectUid,
          },
        }
      );

      this.logger.success(`Experience paused`);
      return ok(result.data);
    } catch (error: any) {
      this.logger.error(error);
      return err(error);
    }
  }

  async activateExperience(
    versionedExperience: ExperienceVersion,
    versionUid: string,
    experienceUid: string,
    projectUid: string
  ): Promise<Result<ExperienceVersion, Error>> {
    this.logger.log(`Activating experience...`);
    try {
      const result = await this.apiClient.put<ExperienceVersion>(
        `/experiences/${experienceUid}/versions/${versionUid}`,
        {
          ...versionedExperience,
          status: 'ACTIVE',
        },
        {
          headers: {
            'X-Project-Uid': projectUid,
          },
        }
      );

      this.logger.success(`Experience activated`);
      return ok(result.data);
    } catch (error: any) {
      this.logger.error(error);
      return err(error);
    }
  }

  async getShortUid(expUid: string, projectUid: string): Promise<Result<string | null, Error>>{
    this.logger.log('Fetching experiences');

    try { 
      const result = await this.apiClient.get<Experience[]>('/experiences', {
        headers: {
          'X-Project-Uid': projectUid
        }
      })

      const matchingExp = result.data.find((exp) => exp.uid === expUid);

      if (!matchingExp) {
        this.logger.error(`No Matching Exp found for ${expUid}`)
        return err(new Error(`No Matching Exp found for ${expUid}`))
      }

      return ok(matchingExp.shortUid);
    } catch (error: any) {
      this.logger.error(error);
      return err(error)
    }
    
  }

  private async fetchExperienceVersions(
    experienceUid: string,
    projectUid: string
  ): Promise<Result<ExperienceVersion[], Error>> {
    this.logger.log(`Fetching experience versions...`);
    try {
      const result = await this.apiClient.get<ExperienceVersion[]>(`/experiences/${experienceUid}/versions`, {
        headers: {
          'X-Project-Uid': projectUid,
        },
      });
      this.logger.success(`Experience versions fetched`);
      return ok(result.data);
    } catch (error: any) {
      this.logger.error(error);
      return err(error);
    }
  }
}
