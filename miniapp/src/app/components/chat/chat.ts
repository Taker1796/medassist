import {Component, output, signal} from '@angular/core';
import{ FormsModule} from '@angular/forms';

@Component({
  selector: 'app-chat',
  imports: [],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat {
  messageText = '';

  // Сигнал для хранения текста сообщения
  message = signal('');

  // Output для отправки сообщения родительскому компоненту
  sendMessageEvent = output<string>();

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

  // Отправка сообщения
  sendMessage(): void {
    const messageText = this.message().trim();

    if (messageText) {
      // Отправляем сообщение родительскому компоненту
      this.sendMessageEvent.emit(messageText);

      // Очищаем поле ввода
      this.message.set('');

      // Сбрасываем высоту textarea
      const textarea = document.querySelector('.chat-textarea') as HTMLTextAreaElement;
      if (textarea) {
        textarea.value = '';
        textarea.style.height = 'auto';
      }
    }
  }
}
