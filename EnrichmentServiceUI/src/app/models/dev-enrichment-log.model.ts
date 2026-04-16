export interface DevEnrichmentLogMessage {
  Role: string;
  Content: string;
}

export interface DevEnrichmentLogPatient {
  PatientId: string;
  Sex?: number | null;
  AgeYears?: number | null;
  Nickname?: string | null;
  Allergies?: string | null;
  ChronicConditions?: string | null;
  Tags?: string | null;
  Status?: number | null;
  Notes?: string | null;
}

export interface DevEnrichmentLogRequest {
  Patient?: DevEnrichmentLogPatient | null;
  DoctorSpecializationCode: string;
  SpecialtyCodeOverride?: string | null;
  Messages: DevEnrichmentLogMessage[];
}

export interface DevEnrichmentLogLlmRequest {
  Messages: DevEnrichmentLogMessage[];
  Model: string;
  Temperature: number;
  MaxTokens: number;
  Stream: boolean;
}

export interface DevEnrichmentLogEntry {
  Id: string;
  CreatedAtUtc: string;
  Endpoint: string;
  Stream: boolean;
  LlmEndpoint: string;
  IncomingRequest: DevEnrichmentLogRequest;
  EnrichedMessages: DevEnrichmentLogMessage[];
  OutgoingLlmRequest: DevEnrichmentLogLlmRequest;
}
