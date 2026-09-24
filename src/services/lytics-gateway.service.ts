import axios, { AxiosInstance } from 'axios';
import {
  err,
  ok,
  Result,
} from 'neverthrow';

import { ConfigService } from './config.service';
import { LoggerService } from './logger.service';
import { LyticsFlow, LyticsSegment } from '../types';

const ALL_SEGMENT_NAME = 'all';

// Thrown for a non-200/network failure calling the gateway - the project
// behind LYTICS_PROJECT_UID likely has no working Lytics connection.
// Distinct from a 200 response that just doesn't contain the expected
// segment/flow, which is a data problem, not a connection problem.
export class LyticsGatewayUnavailableError extends Error {}

// Calls the Lytics API gateway directly (not the personalize-api's own
// /audiences proxy) - scoped via X-Project-Uid to a project that already
// has a working Lytics connection (see ConfigService.getLyticsProjectUid).
export class LyticsGatewayService {
  private apiClient: AxiosInstance;

  constructor(private logger: LoggerService, private config: ConfigService) {
    this.apiClient = axios.create({
      baseURL: this.config.getLyticsGatewayUrl(),
      headers: {
        authtoken: this.config.getAuthToken(),
        organization_uid: this.config.getOrganizationUid(),
        'x-project-uid': this.config.getLyticsProjectUid(),
        'x-cs-api-version': '1',
      },
    });
  }

  async fetchAllAudienceUid(): Promise<Result<string, Error>> {
    this.logger.log('Fetching Lytics "all" audience uid...');
    try {
      const result = await this.apiClient.get<{ data: LyticsSegment[] }>('/segment');
      const allSegment = result.data.data.find(
        (segment) => segment.kind === 'segment' && segment.slug_name === ALL_SEGMENT_NAME
      );
      if (!allSegment) {
        return err(new Error(`No "${ALL_SEGMENT_NAME}" segment found in Lytics account`));
      }
      this.logger.success(`Lytics "all" audience uid: ${allSegment.id}`);
      return ok(allSegment.id);
    } catch (error: any) {
      this.logger.error('Lytics segment fetch failed - is the Lytics account connected?', error);
      return err(new LyticsGatewayUnavailableError(error.message));
    }
  }

  async fetchFlowIdByName(flowName: string): Promise<Result<string, Error>> {
    this.logger.log(`Fetching Lytics flow "${flowName}"...`);
    try {
      const result = await this.apiClient.get<{ data: LyticsFlow[] }>('/flow/ui', {
        params: { latest: false },
      });
      const flow = result.data.data.find((candidate) => candidate.label === flowName);
      if (!flow) {
        return err(new Error(`No Lytics flow named "${flowName}" found`));
      }
      this.logger.success(`Lytics flow "${flowName}" id: ${flow.id}`);
      return ok(flow.id);
    } catch (error: any) {
      this.logger.error('Lytics flow fetch failed - is the Lytics account connected?', error);
      return err(new LyticsGatewayUnavailableError(error.message));
    }
  }
}
