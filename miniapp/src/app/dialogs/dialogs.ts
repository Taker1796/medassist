import { Component } from '@angular/core';

@Component({
  selector: 'app-dialogs',
  imports: [],
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
