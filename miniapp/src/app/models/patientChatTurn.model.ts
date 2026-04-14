export interface PatientChatTurn {
  turnId: string,
  conversationId: string,
  requestId: string,
  userText: string,
  assistantText: string,
  specialtyCode: string | null,
  createdAt: string,
}
