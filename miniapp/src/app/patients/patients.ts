import { Component } from '@angular/core';

@Component({
  selector: 'app-patients',
  imports: [],
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
