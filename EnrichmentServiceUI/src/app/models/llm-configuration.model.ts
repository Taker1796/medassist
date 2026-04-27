export interface LlmConfiguration {
  Id: number;
  Endpoint: string;
  ApiKeyHeader: string;
  ApiKey: string;
}

export interface LlmConfigurationUpdateRequest {
  Endpoint: string;
  ApiKeyHeader: string;
  ApiKey: string;
}
