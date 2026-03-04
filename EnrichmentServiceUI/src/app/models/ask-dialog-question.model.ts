export interface AskDialogQuestionMessage {
  Role: string;
  Content: string;
}

export interface AskDialogQuestionModel {
  PatientId: string;
  DoctorSpecializationCode: string;
  Messages: AskDialogQuestionMessage[];
}
