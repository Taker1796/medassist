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

  create (){
    this.router.navigate(['/upsert-patient'], { state:{mode:"create"}});
  }

  update (){
    this.router.navigate(['/upsert-patient'], { state:{mode:"update"}});
  }

  goToList (){
    this.router.navigate(['/patient-list']);
  }
}
