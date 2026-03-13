import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  imports: [RouterOutlet]
})
export class AppComponent implements OnInit {
  constructor() {}

  ngOnInit() {

    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;

      tg.expand();         // Развернуть на весь экран

      console.log("User:", tg.initDataUnsafe);
    } else {
      alert("Telegram WebApp не доступен!");
    }
  }
}
