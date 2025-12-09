import { Component } from '@angular/core';
import {Router, RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-main',
  imports: [

  ],
  templateUrl: './main.html',
  styleUrl: './main.css',
})
export class Main {

  _router:Router;
  _user: any;

  constructor(router: Router) {
    this._router = router;
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

  goToSpecializations(){
    this._router.navigate(['/specializations']);
  }

}
