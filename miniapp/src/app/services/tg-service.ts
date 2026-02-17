import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TgService {

  public readonly userName: string | null = null;
  public readonly firstName: string | null = null;
  public readonly lastName: string | null = null;
  public readonly initData: object | null = null;
  public readonly id: number;

  constructor() {
    let tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if(tgUser) {
      this.userName = tgUser.username;
      this.firstName = tgUser.first_name;
      this.lastName = tgUser.last_name;
      this.id = tgUser.id;
      this.initData = window.Telegram?.WebApp?.initData;
    }
    else{
      this.userName = 'Taker1796';
      this.id = 777;
    }
  }
}
