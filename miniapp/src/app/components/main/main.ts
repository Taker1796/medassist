import {Component, inject} from '@angular/core';
import {Router, RouterOutlet} from '@angular/router';
import {Chat} from '../chat/chat';
import {MeService} from '../../services/me-service';
import {AsyncPipe} from '@angular/common';
import {BlurOnOutsideTap} from '../../directives/blur-on-outside-tap';

@Component({
  selector: 'app-main',
  imports: [
    Chat,
    AsyncPipe,
    BlurOnOutsideTap

  ],
  templateUrl: './main.html',
  styleUrl: './main.css',
})
export class Main {
  private _router = inject(Router);
  private _meService = inject(MeService);
  userData$ = this._meService.me();
  menuOpen = false;

  constructor(router: Router) {
    this._router = router;
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  goToDoctor(){
    this._router.navigate(['/doctor']);
  }

  goToPatients(){
    this._router.navigate(['/patients']);
  }
}
