import {Component, inject, SecurityContext, signal} from '@angular/core';
import {Router} from '@angular/router';
import {RegistrationService} from '../../services/registration-service';
import {TransitionButtons} from '../transition-buttons/transition-buttons';
import {map, Observable, shareReplay} from 'rxjs';
import {StaticContentService} from '../../services/static-content-service';
import {AsyncPipe} from '@angular/common';
import {DomSanitizer} from '@angular/platform-browser';

@Component({
  selector: 'app-user-agreement',
  imports: [
    TransitionButtons,
    AsyncPipe
  ],
  templateUrl: './user-agreement.html',
  styleUrl: './user-agreement.css',
})
export class UserAgreement {
  isConsentReceived = signal(false);
  private _router  = inject(Router);
  private _registrationService: RegistrationService = inject(RegistrationService);
  private _staticContentService: StaticContentService = inject(StaticContentService);
  private _sanitizer: DomSanitizer = inject(DomSanitizer)
  agreementText$: Observable<string> = this._staticContentService.getUserAgreementText()
    .pipe(
      map(html => this._sanitizer.sanitize(SecurityContext.HTML, html)),
      map(html => html ?? ''),
      map((html: string) => this.normalizeAgreementHtml(html)),
      shareReplay(1)
     );

  buttonsConfig = [
    { label: 'Далее', onClick: () => this.goToSpecializations(), disabled: this.isConsentReceived },
    { label: 'Назад', routerLink: '' }
  ];

  goToSpecializations(){
    this._registrationService.isSpecializationsEnabled = true;
    this._router.navigate(['/specializations'], { state:{mode:"registration"}});
  }

  private normalizeAgreementHtml(html: string): string {
    if (!html.trim()) {
      return '';
    }

    const doc = new DOMParser().parseFromString(html, 'text/html');
    const body = doc.body;
    const rootElement = body.firstElementChild;

    body.querySelectorAll<HTMLElement>('*').forEach((element: HTMLElement) => {
      element.removeAttribute('style');
    });

    if (rootElement) {
      rootElement.classList.add('agreement-rich');
    }

    // Для секций с выделенным блоком добавляем класс callout последнему блоку.
    body.querySelectorAll<HTMLElement>('.agreement-rich > div').forEach((section: HTMLElement) => {
      const directDivChildren = Array.from(section.children)
        .filter((child: Element) => child.tagName === 'DIV') as HTMLElement[];
      if (directDivChildren.length >= 3) {
        directDivChildren[directDivChildren.length - 1].classList.add('agreement-callout');
      }
    });

    return body.innerHTML;
  }
}
