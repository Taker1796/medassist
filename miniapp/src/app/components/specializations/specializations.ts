import {Component, inject} from '@angular/core';
import {Observable} from 'rxjs';
import {Specialization} from '../../models/specializationModel';
import {SpecializationsService} from '../../services/specializations-service';
import {AsyncPipe} from '@angular/common';
import {MatChipsModule} from '@angular/material/chips';
import { CommonModule } from '@angular/common';
import {RouterLink} from '@angular/router';
import {RegistrationService} from '../../services/registration-service';
import {TransitionButtons} from '../transition-buttons/transition-buttons';
import {MeService} from '../../services/me-service';

@Component({
  selector: 'app-specializations',
  imports: [
    AsyncPipe,
    MatChipsModule,
    CommonModule,
    TransitionButtons
  ],
  templateUrl: './specializations.html',
  styleUrl: './specializations.css',
})
export class Specializations {

  buttonsConfig = [
    { label: 'Продолжить', onClick: () => this.register()  },
    { label: 'Назад', routerLink: '' }
  ];

  specializationService: SpecializationsService = inject(SpecializationsService);
  specializations$: Observable<Specialization[]> = this.specializationService.getList();
  selected = new Set<string>();
  registrationService: RegistrationService = inject(RegistrationService);
  meService = inject(MeService);

  toggle(code: string) {
    if (this.selected.has(code)) {
      this.selected.delete(code);
    } else {
      if (this.selected.size > 0) {
        this.selected.clear();
      }
      this.selected.add(code);
    }
  }

  register(){
    this.registrationService.register([...this.selected]);
  }

  updateSpecialization(value: string){
    this.meService.changeSpecialization(value);
  }
}
