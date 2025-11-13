import { Injectable, signal, inject } from '@angular/core';
import { Player } from './types';
import { SupabaseService } from './supabase.service';

export type NotificationType = 'success' | 'error';

export interface Notification {
  message: string;
  type: NotificationType;
}

export interface PlayerDetails extends Player {
  projectedScore: number;
  ownerTeamName?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class UiService {
  private supabase = inject(SupabaseService);
  
  selectedPlayer = signal<PlayerDetails | null>(null);
  notification = signal<Notification | null>(null);

  showPlayerDetails(player: Player, ownerTeamName?: string | null) {
    const currentWeek = this.supabase.getCurrentFantasyWeek();
    const projectedScore = this.supabase.getPlayerProjectedScore(player.id, currentWeek);
    
    this.selectedPlayer.set({
      ...player,
      projectedScore,
      ownerTeamName,
    });
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
