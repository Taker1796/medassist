export interface PatientChatConversationHistory {
  conversationId: string,
  turnsCount: number,
  lastUserText: string,
  isCompleted: boolean,
  completedAt: string | null,
  createdAt: string,
  updatedAt: string,
}
