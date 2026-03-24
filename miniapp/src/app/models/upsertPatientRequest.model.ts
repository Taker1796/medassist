export interface UpsertPatientRequest {
  nickname: string,
  ageYears: number | null,
  sex: number | null,
  allergies: string | null,
  chronicConditions: string | null,
  notes: string | null
}
