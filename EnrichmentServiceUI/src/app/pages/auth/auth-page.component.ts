import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './auth-page.component.html',
  styleUrl: './auth-page.component.scss'
})
export class AuthPageComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  apiKey = '';
  isLoading = signal(false);
  error = signal('');

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      if (params.get('reason') === 'expired') {
        this.error.set('Срок действия API ключа истек. Введите ключ снова.');
      }
    });

    if (this.authService.isAuthorized()) {
      void this.router.navigate(['/templates']);
    }
  }

  submit(): void {
    this.error.set('');
    this.isLoading.set(true);

    this.authService.validateAndStoreKey(this.apiKey).subscribe({
      next: (isValid) => {
        this.isLoading.set(false);

        if (isValid) {
          void this.router.navigate(['/templates']);
          return;
        }

        this.error.set('Некорректный API ключ. Попробуйте снова.');
      },
      error: () => {
        this.isLoading.set(false);
        this.error.set('Не удалось проверить ключ. Попробуйте позже.');
      }
    });
  }
}
