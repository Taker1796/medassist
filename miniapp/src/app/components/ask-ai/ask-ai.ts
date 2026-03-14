import {Component} from '@angular/core';
import {Chat} from '../chat/chat';
import {MenuShell} from '../menu-shell/menu-shell';

@Component({
  selector: 'app-ask-ai',
  standalone: true,
  imports: [
    Chat,
    MenuShell
  ],
  templateUrl: './ask-ai.html',
  styleUrl: './ask-ai.css'
})
export class AskAi {}
