import {Injectable, signal} from '@angular/core';

export type ToastKind = 'success' | 'error';

export interface ToastMessage {
  id: number;
  text: string;
  kind: ToastKind;
  duration: number;
  visible: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  readonly toast = signal<ToastMessage | null>(null);

  private _queue: ToastMessage[] = [];
  private _nextId = 1;
  private _dismissTimer: ReturnType<typeof setTimeout> | null = null;

  success(text: string, duration = 2600): void {
    this.enqueue(text, 'success', duration);
  }

  error(text: string, duration = 3600): void {
    this.enqueue(text, 'error', duration);
  }

  dismiss(): void {
    const activeToast = this.toast();
    if (!activeToast) {
      return;
    }

    this.clearTimer();
    this.toast.set({...activeToast, visible: false});

    setTimeout(() => {
      if (this.toast()?.id !== activeToast.id) {
        return;
      }

      this.toast.set(null);
      this.displayNext();
    }, 220);
  }

  private enqueue(text: string, kind: ToastKind, duration: number): void {
    this._queue.push({
      id: this._nextId++,
      text,
      kind,
      duration,
      visible: false,
    });

    if (!this.toast()) {
      this.displayNext();
    }
  }

  private displayNext(): void {
    if (this.toast() || this._queue.length === 0) {
      return;
    }

    const nextToast = this._queue.shift() ?? null;
    if (!nextToast) {
      return;
    }

    this.toast.set(nextToast);

    setTimeout(() => {
      if (this.toast()?.id !== nextToast.id) {
        return;
      }

      this.toast.set({...nextToast, visible: true});
    }, 10);

    this._dismissTimer = setTimeout(() => {
      this._dismissTimer = null;
      this.dismiss();
    }, nextToast.duration);
  }

  private clearTimer(): void {
    if (!this._dismissTimer) {
      return;
    }

    clearTimeout(this._dismissTimer);
    this._dismissTimer = null;
  }
}
