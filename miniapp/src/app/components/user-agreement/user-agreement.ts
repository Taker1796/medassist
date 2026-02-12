import {Component, inject, SecurityContext, signal} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {RegistrationService} from '../../services/registration-service';
import {TransitionButtons} from '../transition-buttons/transition-buttons';
import {map, Observable, shareReplay} from 'rxjs';
import {Specialization} from '../../models/specializationModel';
import {StaticContentService} from '../../services/static-content-service';
import {AsyncPipe} from '@angular/common';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';

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

}
