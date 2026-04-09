export enum PatientChatStatus {
  New = 0,
  Active = 1,
  Finalizing = 2,
  Completed = 3,
  Failed = 4
}

export interface PatientChatStatusResponse {
  status: number;
}
