import {ChangeDetectorRef, Component, inject, ViewChild} from '@angular/core';
import {Chat} from '../chat/chat';
import {MenuShell} from '../menu-shell/menu-shell';
import {LlmService} from '../../services/llm-service';
import {catchError, EMPTY, finalize} from 'rxjs';

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
export class AskAi {
  private _llmService = inject(LlmService);
  private _cdr = inject(ChangeDetectorRef);

  isClearing = false;

  @ViewChild(Chat) private _chatComponent?: Chat;

  clearChat(): void {
    const confirmed = window.confirm('Очистить историю чата? Это действие нельзя отменить.');
    if (!confirmed || this.isClearing) {
      return;
    }

    this.isClearing = true;
    this._cdr.detectChanges();
    this._llmService.clearGeneralTurns().pipe(
      catchError(err => {
        alert('Не удалось очистить чат. Попробуйте еще раз.');
        console.log(err);
        return EMPTY;
      }),
      finalize(() => {
        this.isClearing = false;
        this._cdr.detectChanges();
      })
    ).subscribe(() => {
      this._chatComponent?.clearChat();
    });
  }
}
