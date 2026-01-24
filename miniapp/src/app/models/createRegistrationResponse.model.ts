export interface CreateRegistrationResponseModel {
  status: number,
  specializationCodes: string[],
  confirmed: boolean,
  startedAt: "string",
  nickname: "string",
  telegramUserId: number
}
