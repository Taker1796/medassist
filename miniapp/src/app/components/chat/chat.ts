import {ChangeDetectorRef, Component, ElementRef, inject, Input, OnInit, output, ViewChild} from '@angular/core';
import{ FormsModule} from '@angular/forms';
import {LlmService} from '../../services/llm-service';
import {LlmRequest} from '../../models/llmRequest.model';
import {catchError, Observable, of} from 'rxjs';
import {GeneralChatTurn} from '../../models/generalChatTurn.model';
import {PatientsService} from '../../services/patients-service';
import {PatientChatTurn} from '../../models/patientChatTurn.model';
import {PatientChatAskRequest} from '../../models/patientChatAskRequest.model';
import {MeService} from '../../services/me-service';
import {MeResponse} from '../../models/meResponse.model';

interface ChatMessage {
  id: string;
  text: string;
  isMine: boolean;
  createdAt: string;
  specialtyCode: string | null;
  isSpecialtyMismatch: boolean;
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
  subspecSuggestions: string[] = [];
  isTyping = false;
  showScrollButton = false;
  private _isUserNearBottom = true;
  private readonly _bottomThreshold = 24;
  private _cdr = inject(ChangeDetectorRef);
  private _llmService = inject(LlmService);
  private _patientsService = inject(PatientsService);
  private _meService = inject(MeService);
  private _currentDoctorSpecialtyCode: string | null = null;
  private _conversationBaseSpecialtyCode: string | null = null;

  @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLElement>;
  @ViewChild('chatTextarea') chatTextarea!: ElementRef<HTMLTextAreaElement>;

  ngOnInit(): void {
    if (this.mode === 'general') {
      this.loadGeneralTurns();
      return;
    }

    if (this.mode === 'patient') {
      this.loadCurrentDoctorSpecialtyCode();
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

  onDialogAreaInteraction(event: Event): void {
    const target = event.target as HTMLElement | null;
    if (!target) {
      return;
    }

    // Не трогаем клавиатуру, если пользователь взаимодействует с зоной ввода
    // или с кнопками подсказок специализаций.
    if (target.closest('.chat-input-container') || target.closest('.subspec-toolbar')) {
      return;
    }

    this.dismissMobileKeyboard();
  }

  // Автоматическое изменение высоты textarea
  autoResize(textarea: HTMLTextAreaElement): void {
    const minHeight = 45;
    const maxHeight = 90;

    textarea.style.height = `${minHeight}px`;
    const nextHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
    if (!textarea.value) {
      this.resetTextareaState(textarea);
    }
  }

  sendMessage(): void {
    if (!this.messageText.trim()) return;

    const shouldStickToBottom = this._isUserNearBottom;
    const userText = this.messageText.trim();
    const requestId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const currentMessageSpecialtyCode = this.mode === 'patient' ? this._currentDoctorSpecialtyCode : null;

    this.messages.push({
      id: requestId,
      text: userText,
      isMine: true,
      createdAt,
      specialtyCode: currentMessageSpecialtyCode,
      isSpecialtyMismatch: this.isSpecialtyMismatch(currentMessageSpecialtyCode),
    });

    this.messageText = '';
    const textarea = this.chatTextarea?.nativeElement;
    if (textarea) {
      textarea.value = '';
      this.autoResize(textarea);
      this.resetTextareaState(textarea);
      requestAnimationFrame(() => {
        if (!textarea.value) {
          this.resetTextareaState(textarea);
        }
      });
    }
    this.dismissMobileKeyboard();

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
            specialtyCode: currentMessageSpecialtyCode,
            createdAt,
          });
        },
        currentMessageSpecialtyCode
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
    const parsed = this.extractSubspecSuggestions(text);

    this.messages.push({
      id: crypto.randomUUID(),
      text:  parsed.cleanText,
      isMine: false,
      createdAt: new Date().toISOString(),
      specialtyCode: null,
      isSpecialtyMismatch: false,
    });
    this.subspecSuggestions = parsed.suggestions;
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

  private dismissMobileKeyboard(): void {
    const textarea = this.chatTextarea?.nativeElement;
    const activeElement = document.activeElement as HTMLElement | null;

    const blurElement = (element: HTMLElement | null | undefined) => {
      if (!element || typeof element.blur !== 'function') {
        return;
      }
      try {
        element.blur();
      } catch {
        // ignore
      }
    };

    // Хак для старых iOS Safari: transient readonly + blur.
    if (textarea) {
      const hadReadonly = textarea.hasAttribute('readonly');
      if (!hadReadonly) {
        textarea.setAttribute('readonly', 'readonly');
      }
      blurElement(textarea);
      if (!hadReadonly) {
        textarea.removeAttribute('readonly');
      }
    }

    blurElement(activeElement);

    const nav = navigator as Navigator & {
      virtualKeyboard?: { hide?: () => void };
    };
    try {
      nav.virtualKeyboard?.hide?.();
    } catch {
      // ignore
    }

    // Повторяем blur в следующих тиках: помогает на iOS 16/17 и части Android WebView.
    requestAnimationFrame(() => {
      blurElement(this.chatTextarea?.nativeElement);
      blurElement(document.activeElement as HTMLElement | null);
    });

    setTimeout(() => {
      blurElement(this.chatTextarea?.nativeElement);
      blurElement(document.activeElement as HTMLElement | null);
    }, 60);
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
      this.subspecSuggestions = this.extractLatestSubspecSuggestions(this.messages);
      this._cdr.detectChanges();
      setTimeout(() => {
        this.scrollToBottom(false);
        this.updateScrollState();
      }, 0);
    });
  }

  private loadCurrentDoctorSpecialtyCode(): void {
    this._meService.me().pipe(
      catchError(() => of<MeResponse | null>(null))
    ).subscribe((me: MeResponse | null) => {
      this._currentDoctorSpecialtyCode = this.normalizeSpecialtyCode(me?.specializations?.[0]?.code ?? null);
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
      this.subspecSuggestions = this.extractLatestSubspecSuggestions(this.messages);
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
          specialtyCode: null,
          isSpecialtyMismatch: false,
        },
        {
          id: `${turn.turnId}-assistant`,
          text: this.extractSubspecSuggestions(turn.assistantText).cleanText,
          isMine: false,
          createdAt: turn.createdAt,
          specialtyCode: null,
          isSpecialtyMismatch: false,
        }
      ])
      .filter((message: ChatMessage) => !!message.text?.trim())
      .sort((a: ChatMessage, b: ChatMessage) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
  }

  private mapPatientTurnsToMessages(turns: PatientChatTurn[]): ChatMessage[] {
    const sortedTurns = [...turns].sort((a: PatientChatTurn, b: PatientChatTurn) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    this._conversationBaseSpecialtyCode = this.resolveBaseSpecialtyCode(sortedTurns);

    return sortedTurns
      .flatMap((turn: PatientChatTurn) => [
        {
          id: `${turn.turnId}-user`,
          text: turn.userText,
          isMine: true,
          createdAt: turn.createdAt,
          specialtyCode: this.normalizeSpecialtyCode(turn.specialtyCode),
          isSpecialtyMismatch: this.isSpecialtyMismatch(turn.specialtyCode),
        },
        {
          id: `${turn.turnId}-assistant`,
          text: this.extractSubspecSuggestions(turn.assistantText).cleanText,
          isMine: false,
          createdAt: turn.createdAt,
          specialtyCode: this.normalizeSpecialtyCode(turn.specialtyCode),
          isSpecialtyMismatch: this.isSpecialtyMismatch(turn.specialtyCode),
        }
      ])
      .filter((message: ChatMessage) => !!message.text?.trim());
  }

  private startStreamMessage(specialtyCode: string | null = null): string {
    const streamMessageId = crypto.randomUUID();
    this.messages.push({
      id: streamMessageId,
      text: '',
      isMine: false,
      createdAt: new Date().toISOString(),
      specialtyCode,
      isSpecialtyMismatch: this.isSpecialtyMismatch(specialtyCode),
    });
    this._cdr.detectChanges();
    return streamMessageId;
  }

  private updateStreamMessage(messageId: string, text: string): void {
    const parsed = this.extractSubspecSuggestions(text);
    const message = this.messages.find((msg: ChatMessage) => msg.id === messageId);
    if (!message) {
      return;
    }

    message.text = parsed.cleanText;
    this.subspecSuggestions = parsed.suggestions;
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

  private resolveBaseSpecialtyCode(turns: PatientChatTurn[]): string | null {
    if (turns.length === 0) {
      return null;
    }

    return this.normalizeSpecialtyCode(turns[0].specialtyCode);
  }

  private normalizeSpecialtyCode(code: string | null | undefined): string | null {
    const normalizedCode = code?.trim();
    return normalizedCode ? normalizedCode : null;
  }

  private isSpecialtyMismatch(specialtyCode: string | null | undefined): boolean {
    const normalizedCode = this.normalizeSpecialtyCode(specialtyCode);
    if (!normalizedCode || !this._conversationBaseSpecialtyCode) {
      return false;
    }

    return normalizedCode !== this._conversationBaseSpecialtyCode;
  }

  private handleStreamingAssistantResponse(
    stream$: Observable<string>,
    shouldStickToBottom: boolean,
    onCompletePersist: (answer: string) => void,
    specialtyCode: string | null = null
  ): void {
    this.isTyping = false;
    const streamMessageId = this.startStreamMessage(specialtyCode);
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
        const parsed = this.extractSubspecSuggestions(streamedAnswer);
        if (parsed.cleanText.trim().length > 0) {
          onCompletePersist(parsed.cleanText);
        } else {
          this.removeStreamMessageIfEmpty(streamMessageId);
        }

        this._cdr.detectChanges();
        this.updateScrollState();
      }
    });
  }

  applySubspecSuggestion(specialization: string): void {
    this.messageText = specialization;
    this._cdr.detectChanges();
    requestAnimationFrame(() => {
      this.chatTextarea?.nativeElement?.focus();
    });
  }

  private extractSubspecSuggestions(text: string): { cleanText: string; suggestions: string[] } {
    const suggestions: string[] = [];
    const cleanText = text.replace(/<subspec>([\s\S]*?)<\/subspec>/gi, (_match: string, value: string) => {
      const normalized = value.trim();
      if (normalized) {
        suggestions.push(normalized);
      }
      return '';
    });

    const openTagIndex = cleanText.toLowerCase().lastIndexOf('<subspec');
    const safeText = openTagIndex >= 0 ? cleanText.slice(0, openTagIndex) : cleanText;

    return {
      cleanText: safeText,
      suggestions: Array.from(new Set(suggestions))
    };
  }

  private extractLatestSubspecSuggestions(messages: ChatMessage[]): string[] {
    for (let index = messages.length - 1; index >= 0; index--) {
      const message = messages[index];
      if (message.isMine) {
        continue;
      }

      const extracted = this.extractSubspecSuggestions(message.text).suggestions;
      if (extracted.length > 0) {
        return extracted;
      }
    }

    return [];
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
    this.subspecSuggestions = [];
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
