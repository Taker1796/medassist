import {Component, inject} from '@angular/core';
import {Router} from '@angular/router';
import {MenuShell} from '../menu-shell/menu-shell';

@Component({
  selector: 'app-main',
  imports: [
    MenuShell
  ],
  templateUrl: './main.html',
  styleUrl: './main.css',
})
export class Main {
  private _router = inject(Router);

  goToPatients(){
    this._router.navigate(['/app/patients']);
  }

  goToAskAi(): void {
    this._router.navigate(['/app/ask-ai']);
  }
}
