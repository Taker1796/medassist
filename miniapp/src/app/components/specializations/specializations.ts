import {Component, inject} from '@angular/core';
import {Observable} from 'rxjs';
import {Specialization} from '../../models/specializationModel';
import {SpecializationsService} from '../../services/specializations-service';
import {AsyncPipe} from '@angular/common';
import {MatChipsModule} from '@angular/material/chips';
import { CommonModule } from '@angular/common';
import {Router, RouterLink} from '@angular/router';
import {RegistrationService} from '../../services/registration-service';
import {IButtonConfig, TransitionButtons} from '../transition-buttons/transition-buttons';
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

  specializationService: SpecializationsService = inject(SpecializationsService);
  specializations$: Observable<Specialization[]> = this.specializationService.getList();
  selected = new Set<string>();
  registrationService: RegistrationService = inject(RegistrationService);
  meService = inject(MeService);
  router = inject(Router);
  mode: string|null  = null;
  buttonsConfig: IButtonConfig[] = [];

  constructor() {
    this.mode = this.router.currentNavigation()?.extras.state?.['mode'];
  }

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

  private register(){
    this.registrationService.register([...this.selected]);
  }

  private updateSpecialization(){
    const val = this.selected.size > 0 ? this.selected.values().next().value! : null;

    this.meService.changeSpecialization(val);
  }

  ngOnInit() {
    this.initButtons();
  }

  private initButtons() {
    if (this.mode === 'registration') {
      this.buttonsConfig = [
        { label: 'Продолжить', onClick: () => this.register()  },
        { label: 'Назад', routerLink: '' }
      ];
    } else {
      this.buttonsConfig = [
        { label: 'Сохранить', onClick: () => this.updateSpecialization() },
        { label: 'Назад', routerLink: '/doctor' }
      ];
    }
  }
}
