import {Component, inject, Input} from '@angular/core';
import {Router} from '@angular/router';
import {BlurOnOutsideTap} from '../../directives/blur-on-outside-tap';
import {AsyncPipe, SlicePipe} from '@angular/common';
import {MeService} from '../../services/me-service';
import {Location} from '@angular/common';

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

  private _router = inject(Router);
  private _meService = inject(MeService);
  private _location = inject(Location);

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
      this._router.navigate([this.backRoute]);
      return;
    }

    this._location.back();
  }
}
