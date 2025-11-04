import { Injectable, signal } from '@angular/core';
import { Player } from './types';

export type NotificationType = 'success' | 'error';

export interface Notification {
  message: string;
  type: NotificationType;
}

@Injectable({
  providedIn: 'root'
})
export class UiService {
  selectedPlayer = signal<Player | null>(null);
  notification = signal<Notification | null>(null);

  showPlayerDetails(player: Player) {
    this.selectedPlayer.set(player);
  }

  hidePlayerDetails() {
    this.selectedPlayer.set(null);
  }

  showNotification(message: string, type: NotificationType = 'success', duration: number = 3000) {
    this.notification.set({ message, type });
    setTimeout(() => {
      this.notification.set(null);
    }, duration);
  }
}
