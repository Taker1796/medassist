import {Specialization} from './specializationModel';

export interface MeResponse {
  doctorId: string,
  specializations: Specialization[],
  telegramUserId: number,
  nickname: string,
  lastSelectedPatientId: string,
  lastSelectedPatientNickname: string,
  verified: boolean,
}
