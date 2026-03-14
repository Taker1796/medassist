import {ChangeDetectorRef, Component, ElementRef, inject, output, ViewChild} from '@angular/core';
import{ FormsModule} from '@angular/forms';
import {LlmService} from '../../services/llm-service';
import {LlmRequest} from '../../models/llmRequest.model';
import {catchError, of} from 'rxjs';
import {LlmResponse} from '../../models/llmResponse.model';

interface ChatMessage {
  text: string;
  isMine: boolean;
}

@Component({
  selector: 'app-chat',
  imports: [FormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})


export class Chat {
  messageText = '';
  isTextareaFocused = false;
  // Output для отправки сообщения родительскому компоненту
  sendMessageEvent = output<string>();
  messages: ChatMessage[] = [];
  isTyping = false;
  showScrollButton = false;
  private _isUserNearBottom = true;
  private _cdr = inject(ChangeDetectorRef);
  private _llmService = inject(LlmService);
  private _conversationId: string|null = null;

  @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLElement>;
  @ViewChild('chatTextarea') chatTextarea!: ElementRef<HTMLTextAreaElement>;

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

    this.messages.push({
      text: this.messageText,
      isMine: true
    });

    const userText = this.messageText;
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

    // скроллим **после рендера**
    setTimeout(() => {
      this.scrollToBottom(true);
    }, 0);

    this.isTyping = true;

    const body: LlmRequest = {
      conversationId: this._conversationId,
      requestId:crypto.randomUUID(),
      text:userText
    }
    this._llmService.ask(body).pipe(
      catchError(err => {
        this.isTyping = false;
        alert('Произошла ошибка. Попробуйте перезагрузить страницу')
        console.log(err);
        return of(null);
      })
    ).
    subscribe((response: LlmResponse | null) => {

      if(!response){
        return;
      }

      this._conversationId = response.conversationId;
      this.handleBotResponse(response.answer);
    })
  }

  handleBotResponse(text: string) {
    this.isTyping = false;

    this.messages.push({
      text:  text,
      isMine: false
    });
    setTimeout(() => {
      this.scrollToBottom(true);
    }, 0);
    this._cdr.detectChanges();
    this.handleAutoScroll();
  }

  onScroll(): void {
    if (!this.messagesContainer) {
      return;
    }

    const el = this.messagesContainer.nativeElement;

    const threshold = 100; // px
    this._isUserNearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;

    this.showScrollButton = !this._isUserNearBottom;
  }

  // вызываем при добавлении нового сообщения или скролле
  handleAutoScroll(): void {
    this.showScrollButton = !this._isUserNearBottom;
  }

  // при клике прокручиваем вниз
  scrollToBottom(smooth = false): void {
    if (!this.messagesContainer) {
      return;
    }

    const el = this.messagesContainer.nativeElement;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    });
    this.showScrollButton = false; // скрываем кнопку после скролла
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
}
