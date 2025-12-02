import { Component } from '@angular/core';
import {RouterLink} from "@angular/router";

@Component({
  selector: 'app-patients',
    imports: [
        RouterLink
    ],
  templateUrl: './patients.html',
  styleUrl: './patients.css',
})
export class Patients {

  Delete (){
    alert("удали меня полностью")
  }
  Create (){
    alert("создай меня полностью")
  }
  GetList (){
    alert("Список")
  }
}
