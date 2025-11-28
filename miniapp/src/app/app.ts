import { Component } from '@angular/core';

declare global {
  interface Window {
    Telegram?: any;
  }
}

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent {

  tg = window.Telegram?.WebApp;

  title = 'MedAssist MiniApp';

  constructor() {
    // Расширяем интерфейс Telegram WebApp на весь экран
    this.tg?.expand();
  }

  onAction() {
    alert('Действие выполнено!');
  }

  sendData() {
    this.tg?.sendData(
      JSON.stringify({ message: 'Привет от MiniApp!' })
    );
  }
}
