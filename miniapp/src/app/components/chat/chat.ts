import {ChangeDetectorRef, Component, ElementRef, inject, Input, OnInit, output, ViewChild} from '@angular/core';
import{ FormsModule} from '@angular/forms';
import {LlmService} from '../../services/llm-service';
import {LlmRequest} from '../../models/llmRequest.model';
import {catchError, Observable, of} from 'rxjs';
import {GeneralChatTurn} from '../../models/generalChatTurn.model';
import {PatientsService} from '../../services/patients-service';
import {PatientChatTurn} from '../../models/patientChatTurn.model';
import {PatientChatAskRequest} from '../../models/patientChatAskRequest.model';

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

      this.handleStreamingAssistantResponse(
        this._patientsService.askCurrentConversationStream(patientId, patientBody),
        shouldStickToBottom,
        (answer: string) => {
          this._patientsService.appendCurrentConversationTurn(patientId, {
            turnId: crypto.randomUUID(),
            conversationId: '',
            requestId,
            userText,
            assistantText: answer,
            createdAt,
          });
        }
      );
      return;
    }

    if (this.mode === 'general') {
      this.handleStreamingAssistantResponse(
        this._llmService.askStream(body),
        shouldStickToBottom,
        (answer: string) => {
          this._llmService.appendGeneralTurn({
          turnId: crypto.randomUUID(),
          requestId,
          userText,
          assistantText: answer,
          createdAt,
        });
        }
      );
      return;
    }

    this._llmService.ask(body).pipe(
      catchError(err => {
        this.isTyping = false;
        alert('Произошла ошибка. Попробуйте перезагрузить страницу')
        console.log(err);
        return of(null);
      })
    ).subscribe((response) => {
      if(!response){
        return;
      }

      this.handleBotResponse(response.answer);
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

  private startStreamMessage(): string {
    const streamMessageId = crypto.randomUUID();
    this.messages.push({
      id: streamMessageId,
      text: '',
      isMine: false,
      createdAt: new Date().toISOString(),
    });
    this._cdr.detectChanges();
    return streamMessageId;
  }

  private updateStreamMessage(messageId: string, text: string): void {
    const message = this.messages.find((msg: ChatMessage) => msg.id === messageId);
    if (!message) {
      return;
    }

    message.text = text;
    this._cdr.detectChanges();
  }

  private removeStreamMessageIfEmpty(messageId: string): void {
    const index = this.messages.findIndex((msg: ChatMessage) => msg.id === messageId && !msg.text.trim());
    if (index === -1) {
      return;
    }

    this.messages.splice(index, 1);
  }

  private mergeStreamChunk(currentText: string, chunk: string): string {
    if (!currentText) {
      return chunk;
    }

    if (chunk === currentText) {
      return currentText;
    }

    // Некоторые провайдеры отдают накопленный текст, а не дельту.
    if (chunk.startsWith(currentText)) {
      return chunk;
    }

    // Полный дубль хвоста игнорируем только для достаточно длинных кусков.
    if (chunk.length >= 10 && currentText.endsWith(chunk)) {
      return currentText;
    }

    const overlap = this.getSuffixPrefixOverlap(currentText, chunk);
    const minReliableOverlap = Math.max(4, Math.floor(chunk.length * 0.7));
    if (overlap >= minReliableOverlap) {
      return currentText + chunk.slice(overlap);
    }

    return currentText + chunk;
  }

  private getSuffixPrefixOverlap(left: string, right: string): number {
    const max = Math.min(left.length, right.length);
    for (let len = max; len > 0; len--) {
      if (left.slice(-len) === right.slice(0, len)) {
        return len;
      }
    }

    return 0;
  }

  private handleStreamingAssistantResponse(
    stream$: Observable<string>,
    shouldStickToBottom: boolean,
    onCompletePersist: (answer: string) => void
  ): void {
    this.isTyping = false;
    const streamMessageId = this.startStreamMessage();
    let streamedAnswer = '';

    stream$.subscribe({
      next: (chunk: string) => {
        if (!chunk) {
          return;
        }

        streamedAnswer = this.mergeStreamChunk(streamedAnswer, chunk);
        this.updateStreamMessage(streamMessageId, streamedAnswer);

        if (shouldStickToBottom) {
          setTimeout(() => this.scrollToBottom(false), 0);
        } else {
          setTimeout(() => this.updateScrollState(), 0);
        }
      },
      error: (err: unknown) => {
        this.isTyping = false;
        this.removeStreamMessageIfEmpty(streamMessageId);
        alert('Произошла ошибка. Попробуйте перезагрузить страницу');
        console.log(err);
        this._cdr.detectChanges();
      },
      complete: () => {
        this.isTyping = false;
        if (streamedAnswer.trim().length > 0) {
          onCompletePersist(streamedAnswer);
        } else {
          this.removeStreamMessageIfEmpty(streamMessageId);
        }

        this._cdr.detectChanges();
        this.updateScrollState();
      }
    });
  }

  formatMessage(text: string): string {
    return this.renderMarkdown(text ?? '');
  }

  private renderMarkdown(sourceText: string): string {
    const normalizedSource = sourceText
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t');
    const text = this.escapeHtml(normalizedSource).replace(/\r\n?/g, '\n');
    const codeBlocks: string[] = [];
    let codeIndex = 0;

    const withPlaceholders = text.replace(/```([\s\S]*?)```/g, (_match: string, code: string) => {
      const codeHtml = `<pre><code>${code.replace(/^\n+|\n+$/g, '')}</code></pre>`;
      const placeholder = `@@CODEBLOCK_${codeIndex}@@`;
      codeBlocks.push(codeHtml);
      codeIndex++;
      return placeholder;
    });

    const lines = withPlaceholders.split('\n');
    const parts: string[] = [];
    let inUnorderedList = false;
    let inOrderedList = false;

    const closeLists = () => {
      if (inUnorderedList) {
        parts.push('</ul>');
        inUnorderedList = false;
      }
      if (inOrderedList) {
        parts.push('</ol>');
        inOrderedList = false;
      }
    };

    for (const rawLine of lines) {
      const line = rawLine.trim();

      if (!line) {
        closeLists();
        continue;
      }

      if (/^@@CODEBLOCK_\d+@@$/.test(line)) {
        closeLists();
        parts.push(line);
        continue;
      }

      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        closeLists();
        const level = headingMatch[1].length;
        parts.push(`<h${level}>${this.renderInlineMarkdown(headingMatch[2])}</h${level}>`);
        continue;
      }

      const orderedItem = line.match(/^(\d+)\.\s+(.+)$/);
      if (orderedItem) {
        if (inUnorderedList) {
          parts.push('</ul>');
          inUnorderedList = false;
        }
        if (!inOrderedList) {
          parts.push('<ol>');
          inOrderedList = true;
        }
        const itemValue = Number(orderedItem[1]);
        parts.push(`<li value="${itemValue}">${this.renderInlineMarkdown(orderedItem[2])}</li>`);
        continue;
      }

      const unorderedItem = line.match(/^[-*]\s+(.+)$/);
      if (unorderedItem) {
        if (inOrderedList) {
          parts.push('</ol>');
          inOrderedList = false;
        }
        if (!inUnorderedList) {
          parts.push('<ul>');
          inUnorderedList = true;
        }
        parts.push(`<li>${this.renderInlineMarkdown(unorderedItem[1])}</li>`);
        continue;
      }

      closeLists();
      parts.push(`<p>${this.renderInlineMarkdown(line)}</p>`);
    }

    closeLists();

    let html = parts.join('');
    codeBlocks.forEach((codeBlockHtml: string, index: number) => {
      html = html.replace(`@@CODEBLOCK_${index}@@`, codeBlockHtml);
    });

    return html;
  }

  private renderInlineMarkdown(line: string): string {
    return line
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
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
