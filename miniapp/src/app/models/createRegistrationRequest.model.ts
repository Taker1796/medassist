export interface CreateRegistrationRequestModel {
  displayName: string,
  specializationCodes: string[],
  telegramUsername: string,
  degrees: string | null,
  experienceYears: number,
  languages: string | null,
  bio: string | null,
  focusAreas: string | null,
  acceptingNewPatients: boolean,
  location: string | null,
  contactPolicy: string | null,
  avatarUrl: string | null,
  humanInLoopConfirmed: boolean
}
