export interface CreateRegistrationResponseModel {
  status: number,
  specializationCodes: string[],
  humanInLoopConfirmed: boolean,
  startedAt: "string",
  telegramUsername: "string"
}
