import { Component } from '@angular/core';
import {RouterLink} from "@angular/router";

@Component({
  selector: 'app-dialogs',
    imports: [
        RouterLink
    ],
  templateUrl: './dialogs.html',
  styleUrl: './dialogs.css',
})
export class Dialogs {

  Create() {
    alert('Создание');
  }
  GetList() {
    alert('Список');
  }
  Close() {
    alert('Закрыть');
  }
}
