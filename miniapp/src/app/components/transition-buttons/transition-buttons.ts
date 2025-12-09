import {Component, Input, Signal} from '@angular/core';
import {RouterLink} from '@angular/router';

interface IButtonConfig {
  label: string;
  onClick?: () => void; // необязательный обработчик
  routerLink?: string;  // необязательная ссылка
  disabled?: boolean | Signal<boolean>;
}

@Component({
  selector: 'app-transition-buttons',
  imports: [
    RouterLink
  ],
  templateUrl: './transition-buttons.html',
  styleUrl: './transition-buttons.css',
})
export class TransitionButtons {
  @Input() buttons: IButtonConfig[] = [];

  isDisabled(btn: IButtonConfig): boolean {
    const d = btn.disabled;

    // если это сигнал — вызываем его как функцию. Функции тоже вызовем
    if (d && typeof (d) === 'function') {
      return !d();
    }

    // если это boolean
    return !!d;
  }
}
