import {ChangeDetectorRef, Component, ElementRef, inject, output, signal, ViewChild} from '@angular/core';
import{ FormsModule} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {LlmService} from '../../services/llm-service';
import {LlmRequest} from '../../models/llmRequest.model';
import {catchError, of, tap} from 'rxjs';

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
  // Output для отправки сообщения родительскому компоненту
  sendMessageEvent = output<string>();
  messages: ChatMessage[] = [];
  isTyping = false;
  showScrollButton = false;
  private _isUserNearBottom = true;
  private _cdr = inject(ChangeDetectorRef);
  private _llmService = inject(LlmService);
  private _conversationId: string|null = null;

  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  // Обработка ввода текста
  onInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.autoResize(textarea);
  }

  // Автоматическое изменение высоты textarea
  autoResize(textarea: HTMLTextAreaElement): void {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
  }

  // Обработка нажатия клавиш
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  sendMessage() {
    if (!this.messageText.trim()) return;

    this.messages.push({
      text: this.messageText,
      isMine: true
    });

    const userText = this.messageText;
    this.messageText = '';

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
        alert('Произошла ошибка. Попробуйте перезагрузить страницу')
        console.log(err);
        return of(null);
      })
    ).
    subscribe(response => {

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

  onScroll() {
    const el = this.messagesContainer.nativeElement;

    const threshold = 100; // px
    this._isUserNearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;

    this.showScrollButton = !this._isUserNearBottom;
  }

  // вызываем при добавлении нового сообщения или скролле
  handleAutoScroll() {
    this.showScrollButton = !this._isUserNearBottom;
  }

  // при клике прокручиваем вниз
  scrollToBottom(smooth = false) {
    const el = this.messagesContainer.nativeElement;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    });
    this.showScrollButton = false; // скрываем кнопку после скролла
  }
}
