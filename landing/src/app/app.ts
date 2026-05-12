import { Component, OnInit, OnDestroy, signal } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class AppComponent implements OnInit, OnDestroy {
  readonly currentSlide = signal(0);
  readonly progressKey = signal(0);
  readonly totalSlides = 4;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    this.progressKey.set(1);
    this.startAuto();
  }

  ngOnDestroy() {
    this.stopAuto();
  }

  private startAuto() {
    this.intervalId = setInterval(() => {
      this.currentSlide.update(v => (v + 1) % this.totalSlides);
      this.progressKey.update(v => v + 1);
    }, 10000);
  }

  private stopAuto() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  goToSlide(i: number) {
    this.currentSlide.set(i);
    this.progressKey.update(v => v + 1);
    this.stopAuto();
    this.startAuto();
  }

  prev() {
    this.goToSlide((this.currentSlide() - 1 + this.totalSlides) % this.totalSlides);
  }

  next() {
    this.goToSlide((this.currentSlide() + 1) % this.totalSlides);
  }
}
