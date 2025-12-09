import {Component, inject} from '@angular/core';
import {Router, RouterLink} from "@angular/router";

@Component({
  selector: 'app-patients',
    imports: [
        RouterLink
    ],
  templateUrl: './patients.html',
  styleUrl: './patients.css',
})
export class Patients {

  router = inject(Router)

  Delete (){
    alert("удали меня полностью")
  }
  Create (){
    this.router.navigate(['/create-patient']);
  }
  GetList (){
    alert("Список")
  }
}
