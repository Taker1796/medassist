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

  Create (){
    this.router.navigate(['/create-patient']);
  }
  goToList (){
    this.router.navigate(['/patient-list']);
  }
}
