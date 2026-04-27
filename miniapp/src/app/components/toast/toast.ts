import {CommonModule} from '@angular/common';
import {Component, inject} from '@angular/core';
import {ToastService} from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.html',
  styleUrl: './toast.css',
})
export class Toast {
  protected readonly toastService = inject(ToastService);
  protected readonly toast = this.toastService.toast;

  protected dismiss(): void {
    this.toastService.dismiss();
  }
}
