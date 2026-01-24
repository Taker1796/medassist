export interface PatientResponse {
  id: string,
  sex: number,
  ageYears: number,
  nickname: string,
  allergies: string,
  chronicConditions: string,
  tags: string,
  status: number,
  notes: string,
  lastInteractionAt: Date
}
