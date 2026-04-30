import {AsyncPipe} from '@angular/common';
import {Component, inject} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {Observable} from 'rxjs';
import {Specialization} from '../../../models/specializationModel';
import {AuthService} from '../../../services/auth-service';
import {SpecializationsService} from '../../../services/specializations-service';
import {ToastService} from '../../../services/toast.service';

@Component({
  selector: 'app-register',
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private _fb = inject(FormBuilder);
  private _authService = inject(AuthService);
  private _router = inject(Router);
  private _toast = inject(ToastService);
  private _specializationsService = inject(SpecializationsService);

  isSubmitting = false;
  selectedSpecialization: string | null = null;
  specializations$: Observable<Specialization[]> = this._specializationsService.getList();

  form = this._fb.group({
    login: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    nickname: ['', [Validators.required]],
  });

  toggleSpecialization(code: string): void {
    this.selectedSpecialization = this.selectedSpecialization === code ? null : code;
  }

  submit(): void {
    if (this.form.invalid || !this.selectedSpecialization || this.isSubmitting) {
      this.form.markAllAsTouched();
      if (!this.selectedSpecialization) {
        this._toast.error('Выберите специализацию');
      }
      return;
    }

    this.isSubmitting = true;
    this._authService.register({
      login: this.form.controls.login.value?.trim() ?? '',
      password: this.form.controls.password.value ?? '',
      nickname: this.form.controls.nickname.value?.trim() ?? '',
      specializationCodes: [this.selectedSpecialization]
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
        void this._router.navigate(['/']);
      },
      error: (error: unknown) => {
        this.isSubmitting = false;
        this._toast.error(this._authService.getErrorMessage(error, 'Не удалось зарегистрироваться'));
      }
    });
  }
}
