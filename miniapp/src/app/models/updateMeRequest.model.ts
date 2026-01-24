import {Specialization} from './specializationModel';

export interface UpdateMeRequest {
  specializations: Specialization[],
  nickname: string,
  lastSelectedPatientId: string
}
