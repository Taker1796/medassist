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

  constructor(router: Router) {
    this._router = router;
  }

  goToDialogs(){
    this._router.navigate(['/dialogs']);
  }

  goToDoctor(){
    this._router.navigate(['/doctor']);
  }
}
