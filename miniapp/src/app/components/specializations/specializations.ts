import {Component, inject, OnInit} from '@angular/core';
import {Observable} from 'rxjs';
import {Specialization} from '../../models/specializationModel';
import {SpecializationsService} from '../../services/specializations-service';
import {AsyncPipe} from '@angular/common';
import {MatChipsModule} from '@angular/material/chips';
import { CommonModule } from '@angular/common';
import {Router} from '@angular/router';
import {RegistrationService} from '../../services/registration-service';
import {IButtonConfig, TransitionButtons} from '../transition-buttons/transition-buttons';
import {MeService} from '../../services/me-service';
import {MenuShell} from '../menu-shell/menu-shell';
import {ToastService} from '../../services/toast.service';

@Component({
  selector: 'app-specializations',
  imports: [
    AsyncPipe,
    MatChipsModule,
    CommonModule,
    TransitionButtons,
    MenuShell
  ],
  templateUrl: './specializations.html',
  styleUrl: './specializations.css',
})
export class Specializations implements OnInit {

  specializationService: SpecializationsService = inject(SpecializationsService);
  specializations$: Observable<Specialization[]> = this.specializationService.getList();
  selected = new Set<string>();
  registrationService: RegistrationService = inject(RegistrationService);
  meService = inject(MeService);
  router = inject(Router);
  toast = inject(ToastService);
  mode: string|null  = null;
  returnUrl = '/doctor';
  buttonsConfig: IButtonConfig[] = [];

  constructor() {
    const navState = this.router.currentNavigation()?.extras.state;
    this.mode = navState?.['mode'] ?? history.state?.['mode'] ?? null;
    this.returnUrl = navState?.['returnUrl'] ?? history.state?.['returnUrl'] ?? '/doctor';
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

    this.selected = new Set(this.selected);
  }

  private register(){
    this.registrationService.register([...this.selected]);
  }

  private updateSpecialization(): void {
    const val = this.selected.size > 0 ? (this.selected.values().next().value as string) : null;

    this.meService.changeSpecialization(val).subscribe(() => {
      this.toast.success('Специализация указана');
      this.router.navigateByUrl(this.returnUrl);
    });
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
        { label: 'Сохранить', onClick: () => this.updateSpecialization() }
      ];
    }
  }
}
