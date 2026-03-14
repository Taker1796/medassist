export interface PatientVisit {
  id: string;
  startedAt?: string | null;
  endedAt?: string | null;
  status?: string | null;
  summary?: string | null;
  anamnesis?: string | null;
  title?: string | null;
}
