import {Specialization} from './specializationModel';

export interface MeResponse {
  doctorId: string,
  specializations: Specialization[],
  telegramUserId?: number | null,
  tokenBalance?: number,
  nickname?: string | null,
  lastSelectedPatientId?: string | null,
  lastSelectedPatientNickname?: string | null,
  verified?: boolean,
}
