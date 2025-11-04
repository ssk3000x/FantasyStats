import { Injectable, signal } from '@angular/core';
import { Player } from './types';

@Injectable({
  providedIn: 'root'
})
export class UiService {
  selectedPlayer = signal<Player | null>(null);

  showPlayerDetails(player: Player) {
    this.selectedPlayer.set(player);
  }

  hidePlayerDetails() {
    this.selectedPlayer.set(null);
  }
}
