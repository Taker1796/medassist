import {Component, inject} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {AuthService} from '../../../services/auth-service';
import {ToastService} from '../../../services/toast.service';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private _fb = inject(FormBuilder);
  private _authService = inject(AuthService);
  private _router = inject(Router);
  private _toast = inject(ToastService);

  isSubmitting = false;
  showPassword = false;

  form = this._fb.group({
    login: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }

    const login = this.form.controls.login.value?.trim() ?? '';
    const password = this.form.controls.password.value ?? '';

    this.isSubmitting = true;
    this._authService.login(login, password).subscribe({
      next: () => {
        this.isSubmitting = false;
        void this._router.navigate(['/app']);
      },
      error: (error: unknown) => {
        this.isSubmitting = false;
        this._toast.error(this._authService.getErrorMessage(error, 'Не удалось войти'));
      }
    });
  }
}
