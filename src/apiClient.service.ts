import axios, { AxiosInstance } from 'axios';

import { ConfigService } from './config.service';

export class ApiClient  {
  private apiClient: AxiosInstance;
  private baseUrl: string;
  private authToken: string;
  private organizationUid: string;

  constructor(configService: ConfigService) {
    this.baseUrl = configService.getApiUrl();
    this.authToken = configService.getAuthToken();
    this.organizationUid = configService.getOrganizationUid();

    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Organization_uid: this.organizationUid,
        Authtoken: this.authToken,
      },
    });
  }
}
