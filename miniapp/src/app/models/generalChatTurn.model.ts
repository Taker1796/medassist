export interface GeneralChatTurn {
  turnId: string,
  requestId: string,
  userText: string,
  assistantText: string,
  specialtyCode?: string | null,
  createdAt: string,
}
