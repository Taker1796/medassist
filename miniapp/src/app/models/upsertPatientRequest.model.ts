export interface UpsertPatientRequest {
  nickname: string,
  ageYears: number,
  sex: string,
  allergies: string,
  chronicConditions: string,
  notes: string
}
