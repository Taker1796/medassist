import {ChangeDetectorRef, Component, ElementRef, inject, output, signal, ViewChild} from '@angular/core';
import{ FormsModule} from '@angular/forms';

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
  // Сигнал для хранения текста сообщения
  message = signal('');
  // Output для отправки сообщения родительскому компоненту
  sendMessageEvent = output<string>();
  messages: ChatMessage[] = [];
  isTyping = false;
  showScrollButton = false;
  private isUserNearBottom = true;
  private _cdr = inject(ChangeDetectorRef);

  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  // Обработка ввода текста
  onInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.message.set(textarea.value);
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

    this.fakeBotResponse(userText);
  }

  fakeBotResponse(text: string) {
    this.isTyping = true;

    setTimeout(() => {
      this.isTyping = false;

      this.messages.push({
        text: 'Ответ на: ' + text,
        isMine: false
      });

      this._cdr.detectChanges();
      this.handleAutoScroll();
    }, 1000);
  }

  onScroll() {
    const el = this.messagesContainer.nativeElement;

    const threshold = 100; // px
    this.isUserNearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;

    this.showScrollButton = !this.isUserNearBottom;
  }

  // вызываем при добавлении нового сообщения или скролле
  handleAutoScroll() {
    this.showScrollButton = !this.isUserNearBottom;
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
