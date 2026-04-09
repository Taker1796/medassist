export interface PatientChatConversationHistory {
  conversationId: string,
  turnsCount: number,
  lastUserText: string,
  isCompleted?: boolean,
  status: number,
  completedAt: string | null,
  createdAt: string,
  updatedAt: string,
}
