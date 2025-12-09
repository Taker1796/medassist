export interface PatientResponse {
  id: string,
  fullName: string,
  birthDate: Date | null,
  sex: number,
  phone: string,
  email: string,
  allergies: string,
  chronicConditions: "string",
  tags: string,
  status: number,
  notes: string,
  createdAt: Date,
  updatedAt: Date,
  lastDialogId: string,
  lastSummary: string,
  lastInteractionAt: Date
}
