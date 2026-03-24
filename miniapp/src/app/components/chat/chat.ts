import {ChangeDetectorRef, Component, ElementRef, inject, Input, OnInit, output, ViewChild} from '@angular/core';
import{ FormsModule} from '@angular/forms';
import {LlmService} from '../../services/llm-service';
import {LlmRequest} from '../../models/llmRequest.model';
import {catchError, of} from 'rxjs';
import {LlmResponse} from '../../models/llmResponse.model';
import {GeneralChatTurn} from '../../models/generalChatTurn.model';
import {PatientsService} from '../../services/patients-service';
import {PatientChatTurn} from '../../models/patientChatTurn.model';
import {PatientChatAskRequest} from '../../models/patientChatAskRequest.model';
import {PatientChatAskResponse} from '../../models/patientChatAskResponse.model';

interface ChatMessage {
  id: string;
  text: string;
  isMine: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  inputs: ['mode', 'patientId'],
  imports: [FormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})


export class Chat implements OnInit {
  @Input() mode: 'bot' | 'general' | 'patient' = 'bot';
  @Input() patientId: string | null = null;
  messageText = '';
  isTextareaFocused = false;
  // Output для отправки сообщения родительскому компоненту
  sendMessageEvent = output<string>();
  messages: ChatMessage[] = [];
  isTyping = false;
  showScrollButton = false;
  private _isUserNearBottom = true;
  private readonly _bottomThreshold = 24;
  private _cdr = inject(ChangeDetectorRef);
  private _llmService = inject(LlmService);
  private _patientsService = inject(PatientsService);

  @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLElement>;
  @ViewChild('chatTextarea') chatTextarea!: ElementRef<HTMLTextAreaElement>;

  ngOnInit(): void {
    if (this.mode === 'general') {
      this.loadGeneralTurns();
      return;
    }

    if (this.mode === 'patient') {
      this.loadPatientTurns();
    }
  }

  // Обработка ввода текста
  onInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.autoResize(textarea);
  }

  onTextareaFocus(): void {
    this.isTextareaFocused = true;
  }

  onTextareaBlur(): void {
    this.isTextareaFocused = false;
    const textarea = this.chatTextarea?.nativeElement;
    if (!textarea || textarea.value) {
      return;
    }

    this.resetTextareaState(textarea);
  }

  // Автоматическое изменение высоты textarea
  autoResize(textarea: HTMLTextAreaElement): void {
    const fixedHeight = 90;
    textarea.style.height = `${fixedHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > fixedHeight ? 'auto' : 'hidden';
    if (!textarea.value) {
      this.resetTextareaState(textarea);
    }
  }

  // Обработка нажатия клавиш
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  sendMessage(): void {
    if (!this.messageText.trim()) return;

    const shouldStickToBottom = this._isUserNearBottom;
    const userText = this.messageText.trim();
    const requestId = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    this.messages.push({
      id: requestId,
      text: userText,
      isMine: true,
      createdAt,
    });

    this.messageText = '';
    const textarea = this.chatTextarea?.nativeElement;
    if (textarea) {
      textarea.blur();
      textarea.value = '';
      this.autoResize(textarea);
      this.resetTextareaState(textarea);
      requestAnimationFrame(() => {
        if (!textarea.value) {
          this.resetTextareaState(textarea);
        }
      });
    }

    if (shouldStickToBottom) {
      // скроллим после рендера, только если пользователь уже внизу
      setTimeout(() => {
        this.scrollToBottom(true);
      }, 0);
    } else {
      setTimeout(() => {
        this.updateScrollState();
      }, 0);
    }

    this.isTyping = true;

    const body: LlmRequest = {
      requestId,
      text:userText
    }
    if (this.mode === 'patient') {
      const patientId = this.patientId;
      if (!patientId) {
        this.isTyping = false;
        alert('Не удалось определить пациента для чата');
        return;
      }

      const patientBody: PatientChatAskRequest = {
        requestId,
        text: userText
      };

      this._patientsService.askCurrentConversation(patientId, patientBody).pipe(
        catchError(err => {
          this.isTyping = false;
          alert('Произошла ошибка. Попробуйте перезагрузить страницу')
          console.log(err);
          return of(null);
        })
      ).subscribe((response: PatientChatAskResponse | null) => {
        if(!response){
          return;
        }

        this.handleBotResponse(response.answer);
        this._patientsService.appendCurrentConversationTurn(patientId, {
          turnId: crypto.randomUUID(),
          conversationId: '',
          requestId,
          userText,
          assistantText: response.answer,
          createdAt,
        });
      });
      return;
    }

    this._llmService.ask(body).pipe(
      catchError(err => {
        this.isTyping = false;
        alert('Произошла ошибка. Попробуйте перезагрузить страницу')
        console.log(err);
        return of(null);
      })
    ).subscribe((response: LlmResponse | null) => {
      if(!response){
        return;
      }

      this.handleBotResponse(response.answer);

      if (this.mode === 'general') {
        this._llmService.appendGeneralTurn({
          turnId: crypto.randomUUID(),
          requestId,
          userText,
          assistantText: response.answer,
          createdAt,
        });
      }
    })
  }

  handleBotResponse(text: string) {
    const shouldStickToBottom = this._isUserNearBottom;
    this.isTyping = false;

    this.messages.push({
      id: crypto.randomUUID(),
      text:  text,
      isMine: false,
      createdAt: new Date().toISOString(),
    });
    if (shouldStickToBottom) {
      setTimeout(() => {
        this.scrollToBottom(true);
      }, 0);
    } else {
      setTimeout(() => {
        this.updateScrollState();
      }, 0);
    }
    this._cdr.detectChanges();
    this.updateScrollState();
  }

  onScroll(): void {
    if (!this.messagesContainer) {
      return;
    }

    this.updateScrollState();
  }

  // вызываем при добавлении нового сообщения или скролле
  scrollToBottom(smooth = false): void {
    if (!this.messagesContainer) {
      return;
    }

    const el = this.messagesContainer.nativeElement;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    });
    this._isUserNearBottom = true;
    this.showScrollButton = false;
    this._cdr.detectChanges();
  }

  private resetTextareaState(textarea: HTMLTextAreaElement): void {
    textarea.scrollTop = 0;
    textarea.scrollLeft = 0;
    try {
      textarea.setSelectionRange(0, 0);
    } catch {
      // Selection API может бросать исключение в некоторых мобильных браузерах
    }
  }

  private loadGeneralTurns(): void {
    this._llmService.getGeneralTurns(true).pipe(
      catchError(err => {
        alert('Не удалось загрузить историю диалога')
        console.log(err);
        return of([]);
      })
    ).subscribe((turns: GeneralChatTurn[]) => {
      this.messages = this.mapTurnsToMessages(turns);
      this._cdr.detectChanges();
      setTimeout(() => {
        this.scrollToBottom(false);
        this.updateScrollState();
      }, 0);
    });
  }

  private loadPatientTurns(): void {
    const patientId = this.patientId;
    if (!patientId) {
      return;
    }

    this._patientsService.getCurrentConversationTurns(patientId).pipe(
      catchError(err => {
        alert('Не удалось загрузить историю приёма');
        console.log(err);
        return of([]);
      })
    ).subscribe((turns: PatientChatTurn[]) => {
      this.messages = this.mapPatientTurnsToMessages(turns);
      this._cdr.detectChanges();
      setTimeout(() => {
        this.scrollToBottom(false);
        this.updateScrollState();
      }, 0);
    });
  }

  private mapTurnsToMessages(turns: GeneralChatTurn[]): ChatMessage[] {
    return turns
      .flatMap((turn: GeneralChatTurn) => [
        {
          id: `${turn.turnId}-user`,
          text: turn.userText,
          isMine: true,
          createdAt: turn.createdAt,
        },
        {
          id: `${turn.turnId}-assistant`,
          text: turn.assistantText,
          isMine: false,
          createdAt: turn.createdAt,
        }
      ])
      .filter((message: ChatMessage) => !!message.text?.trim())
      .sort((a: ChatMessage, b: ChatMessage) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
  }

  private mapPatientTurnsToMessages(turns: PatientChatTurn[]): ChatMessage[] {
    return turns
      .flatMap((turn: PatientChatTurn) => [
        {
          id: `${turn.turnId}-user`,
          text: turn.userText,
          isMine: true,
          createdAt: turn.createdAt,
        },
        {
          id: `${turn.turnId}-assistant`,
          text: turn.assistantText,
          isMine: false,
          createdAt: turn.createdAt,
        }
      ])
      .filter((message: ChatMessage) => !!message.text?.trim())
      .sort((a: ChatMessage, b: ChatMessage) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
  }

  clearChat(): void {
    this.messages = [];
    this.isTyping = false;
    this._isUserNearBottom = true;
    this.showScrollButton = false;
    this._cdr.detectChanges();
  }

  private updateScrollState(): void {
    if (!this.messagesContainer) {
      return;
    }

    const el = this.messagesContainer.nativeElement;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    this._isUserNearBottom = distanceToBottom <= this._bottomThreshold;
    const hasScrollableContent = el.scrollHeight > el.clientHeight + this._bottomThreshold;
    this.showScrollButton = hasScrollableContent && !this._isUserNearBottom;
  }
}
