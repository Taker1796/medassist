import {Component, inject, Input} from '@angular/core';
import {Router} from '@angular/router';
import {BlurOnOutsideTap} from '../../directives/blur-on-outside-tap';
import {AsyncPipe, SlicePipe} from '@angular/common';
import {MeService} from '../../services/me-service';
import {Location} from '@angular/common';
import {MeResponse} from '../../models/meResponse.model';
import {AuthService} from '../../services/auth-service';

@Component({
  selector: 'app-menu-shell',
  standalone: true,
  imports: [
    BlurOnOutsideTap,
    AsyncPipe,
    SlicePipe
  ],
  templateUrl: './menu-shell.html',
  styleUrl: './menu-shell.css'
})
export class MenuShell {
  @Input() title = '';
  @Input() showHome = false;
  @Input() showPatient = false;
  @Input() showBack = true;
  @Input() backRoute: string | null = null;
  @Input() allowSpecializationEdit = true;
  @Input() specializationTitleOverride: string | null = null;

  private _router = inject(Router);
  private _meService = inject(MeService);
  private _location = inject(Location);
  private _authService = inject(AuthService);

  menuOpen = false;
  userData$ = this._meService.me();

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  goToMain(): void {
    this._router.navigate(['']);
  }

  goToDoctor(): void {
    this._router.navigate(['/doctor']);
  }

  goToPatients(): void {
    this._router.navigate(['/patients']);
  }

  goToAskAi(): void {
    this._router.navigate(['/ask-ai']);
  }

  logout(): void {
    this._authService.logout();
  }

  isActiveRoute(path: string): boolean {
    if (path === '/') {
      return this._router.url === '/';
    }

    return this._router.url.startsWith(path);
  }

  goToSpecializations(): void {
    this._router.navigate(['/specializations'], {
      state: {
        mode: 'change',
        returnUrl: this._router.url
      }
    });
  }

  goBack(): void {
    if (this.backRoute) {
      this._router.navigateByUrl(this.backRoute);
      return;
    }

    this._location.back();
  }

  getSpecializationTitle(data: MeResponse): string {
    if (this.specializationTitleOverride?.trim()) {
      return this.specializationTitleOverride;
    }

    return data.specializations?.length ? data.specializations[0].title : 'Не выбрана';
  }

  getUserInitials(data: MeResponse): string {
    const displayName = this.getUserDisplayName(data).trim();
    const parts = displayName.split(/\s+/).filter(Boolean).slice(0, 2);

    if (parts.length === 0) {
      return 'M';
    }

    return parts.map((part: string) => part[0]?.toUpperCase() ?? '').join('');
  }

  getUserDisplayName(data: MeResponse): string {
    const nickname = data.nickname?.trim();
    return nickname && nickname.length > 0 ? nickname : 'Доктор';
  }

  getEyebrow(): string {
    if (this.showPatient) {
      return 'Patient workspace';
    }

    return 'Desktop workspace';
  }

  getPageSubtitle(): string {
    switch (this.title) {
      case 'Главная':
        return 'Быстрый доступ к пациентам, профилю и ИИ-консультациям.';
      case 'Пациенты':
        return 'Работайте с реестром пациентов и открывайте клинические карты.';
      case 'Профиль врача':
        return 'Управляйте профилем, специализацией и текущей сессией.';
      case 'Спросить у ИИ':
        return 'Общий диалог с ИИ-помощником для клинических вопросов.';
      case 'Карта пациента':
        return 'Данные пациента, история приемов и быстрые действия.';
      case 'Итоги приёма':
        return 'Сводка по завершенному приему и готовый итог консультации.';
      default:
        return 'Рабочее пространство врача в desktop-формате.';
    }
  }
}
