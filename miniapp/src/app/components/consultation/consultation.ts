import {Component} from '@angular/core';
import {Chat} from '../chat/chat';
import {MenuShell} from '../menu-shell/menu-shell';

@Component({
  selector: 'app-consultation',
  standalone: true,
  imports: [
    Chat,
    MenuShell
  ],
  templateUrl: './consultation.html',
  styleUrl: './consultation.css',
})
export class Consultation {}
