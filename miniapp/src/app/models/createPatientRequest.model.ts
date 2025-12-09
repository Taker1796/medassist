export interface PatientCreateRequestModel {
  fullName: string,
  birthDate: Date | null,
  sex: number,
  phone: string,
  email: string,
  allergies: string,
  chronicConditions: string,
  tags: string,
  notes: string,
  status: number
}
