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

    // Если клик/тап вне input/textarea, снимаем фокус
    if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
      (document.activeElement as HTMLElement)?.blur();
    }
  }
}
