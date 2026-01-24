export interface CreateRegistrationRequestModel {
  telegramUserId: number,
  specializationCodes: string[],
  nickname: string,
  confirmed: boolean
}
