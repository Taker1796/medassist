import { Component } from '@angular/core';
import {Router} from '@angular/router';

@Component({
  selector: 'app-main',
  imports: [],
  templateUrl: './main.html',
  styleUrl: './main.css',
})
export class Main {

  _router:Router;
  _user: any;

  constructor(router: Router) {
    this._router = router;
  }

  showUserName(){

    alert(window.Telegram?.WebApp?.initDataUnsafe?.user?.username);
  }

  goToDialogs(){
    this._router.navigate(['/dialogs']);
  }

  goToDoctor(){
    this._router.navigate(['/doctor']);
  }

  goToPatients(){
    this._router.navigate(['/patients']);
  }


}
