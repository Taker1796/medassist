import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {Toast} from './components/toast/toast';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  imports: [RouterOutlet, Toast]
})
export class AppComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
}
