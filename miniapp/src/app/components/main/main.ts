import {Component, inject} from '@angular/core';
import {Router, RouterOutlet} from '@angular/router';
import {Chat} from '../chat/chat';
import {MeService} from '../../services/me-service';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'app-main',
  imports: [
    Chat,
    AsyncPipe

  ],
  templateUrl: './main.html',
  styleUrl: './main.css',
})
export class Main {
  messages: string[] = [];
  private _router = inject(Router);
  private _meService = inject(MeService);
  userData$ = this._meService.me();


  constructor(router: Router) {
    this._router = router;
  }

  goToDoctor(){
    this._router.navigate(['/doctor']);
  }

  goToPatients(){
    this._router.navigate(['/patients']);
  }

  onMessageSent(message: string): void {
    this.messages.push(message);
    alert('Сообщение отправлено:' +message);
  }

}
