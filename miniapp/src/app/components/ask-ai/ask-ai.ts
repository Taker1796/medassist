import {ChangeDetectorRef, Component, inject, OnInit, ViewChild} from '@angular/core';
import {Chat} from '../chat/chat';
import {MenuShell} from '../menu-shell/menu-shell';
import {LlmService} from '../../services/llm-service';
import {catchError, EMPTY, finalize, map, Observable, of, switchMap} from 'rxjs';
import {GeneralChatTurn} from '../../models/generalChatTurn.model';
import {SpecializationsService} from '../../services/specializations-service';
import {Specialization} from '../../models/specializationModel';
import {ToastService} from '../../services/toast.service';

@Component({
  selector: 'app-ask-ai',
  standalone: true,
  imports: [
    Chat,
    MenuShell
  ],
  templateUrl: './ask-ai.html',
  styleUrl: './ask-ai.css'
})
export class AskAi implements OnInit {
  private _llmService = inject(LlmService);
  private _specializationsService = inject(SpecializationsService);
  private _cdr = inject(ChangeDetectorRef);
  private _toast = inject(ToastService);

  isClearing = false;
  conversationSpecializationTitle: string | null = null;

  @ViewChild(Chat) private _chatComponent?: { clearChat: () => void };

  ngOnInit(): void {
    this.loadConversationSpecialization();
  }

  clearChat(): void {
    const confirmed = window.confirm('Очистить историю чата? Это действие нельзя отменить.');
    if (!confirmed || this.isClearing) {
      return;
    }

    this.isClearing = true;
    this._cdr.detectChanges();
    this._llmService.clearGeneralTurns().pipe(
      catchError(err => {
        this._toast.error('Не удалось очистить чат. Попробуйте ещё раз.');
        console.log(err);
        return EMPTY;
      }),
      finalize(() => {
        this.isClearing = false;
        this._cdr.detectChanges();
      })
    ).subscribe(() => {
      this.conversationSpecializationTitle = null;
      this._chatComponent?.clearChat();
    });
  }

  private loadConversationSpecialization(): void {
    this._llmService.getGeneralTurns(true).pipe(
      map((turns: GeneralChatTurn[]) => this.resolveEarliestSpecialtyCode(turns)),
      switchMap((specialtyCode: string | null) => this.resolveSpecializationTitle(specialtyCode)),
      catchError(() => of<string | null>(null))
    ).subscribe((specializationTitle: string | null) => {
      this.conversationSpecializationTitle = specializationTitle;
    });
  }

  private resolveEarliestSpecialtyCode(turns: GeneralChatTurn[]): string | null {
    if (turns.length === 0) {
      return null;
    }

    const earliestTurn = [...turns].sort((a: GeneralChatTurn, b: GeneralChatTurn) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )[0];

    const normalizedCode = earliestTurn.specialtyCode?.trim();
    return normalizedCode ? normalizedCode : null;
  }

  private resolveSpecializationTitle(specialtyCode: string | null): Observable<string | null> {
    if (!specialtyCode) {
      return of<string | null>(null);
    }

    return this._specializationsService.getList().pipe(
      map((specializations: Specialization[]) => {
        const specialization = specializations.find((item: Specialization) => item.code === specialtyCode);
        return specialization?.title ?? specialtyCode;
      }),
      catchError(() => of<string | null>(specialtyCode))
    );
  }
}
