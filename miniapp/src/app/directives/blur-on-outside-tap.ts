import {Directive, HostListener} from '@angular/core';

@Directive({
  selector: '[appBlurOnOutsideTap]',
})
export class BlurOnOutsideTap {

  constructor() { }

  @HostListener('document:touchstart', ['$event'])
  @HostListener('document:click', ['$event'])
  handleClick(event: Event) {
    const target = event.target as HTMLElement;

    // Не перехватываем тапы по интерактивным элементам (особенно кнопкам),
    // иначе в мобильном WebView первый тап может только закрывать клавиатуру.
    const interactiveTarget = target.closest('button, a, [role="button"]');
    if (interactiveTarget) {
      return;
    }

    const formTarget = target.closest('input, textarea, select');
    if (formTarget) {
      return;
    }

    (document.activeElement as HTMLElement)?.blur();
  }
}
