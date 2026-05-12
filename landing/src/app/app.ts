import { Component, OnInit, OnDestroy, signal } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class AppComponent implements OnInit, OnDestroy {
  readonly currentSlide = signal(0);
  readonly progressKey = signal(0);
  readonly scrolled = signal(false);
  readonly totalSlides = 4;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private readonly onScroll = () => {
    this.scrolled.set(window.scrollY > 40);
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = maxScroll > 0 ? Math.min(window.scrollY / maxScroll, 1) : 0;
    document.documentElement.style.setProperty('--gradient-angle', `${155 + ratio * 180}deg`);
  };

  ngOnInit() {
    this.progressKey.set(1);
    this.startAuto();
    window.addEventListener('scroll', this.onScroll, { passive: true });
  }

  ngOnDestroy() {
    this.stopAuto();
    window.removeEventListener('scroll', this.onScroll);
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
