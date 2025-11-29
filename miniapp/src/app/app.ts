import {Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {Main} from './main/main';

declare global {
  interface Window {
    Telegram?: any;
  }
}

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  imports: [
    RouterOutlet
  ]
})
export class AppComponent {

  tg = window.Telegram?.WebApp;

  constructor() {
    // Расширяем интерфейс Telegram WebApp на весь экран
    this.tg?.expand();
  }
}
