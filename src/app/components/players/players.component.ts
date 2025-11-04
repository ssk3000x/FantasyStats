import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';
import { Player, Roster, Team } from '../../services/types';
import { UiService } from '../../services/ui.service';

type PlayerFilter = 'FREE' | 'ALL';

interface PlayerWithOwner extends Player {
  ownerTeamName: string | null;
}

@Component({
  selector: 'app-players',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './players.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayersComponent {
  private supabase: SupabaseService = inject(SupabaseService);
  private uiService: UiService = inject(UiService);

  filterPosition = signal<PlayerFilter>('FREE');

  isModalOpen = signal(false);
  selectedPlayerToAdd = signal<Player | null>(null);
  playerToDropId = signal<number | null>(null);
  
  transactionSuccess = signal(false);

  positions: PlayerFilter[] = ['FREE', 'ALL'];
  
  private players = computed<PlayerWithOwner[]>(() => {
    const players = this.supabase.getPlayers();
    const rosters = this.supabase.getRosters();
    const teams = this.supabase.getTeams();

    return players.map(player => {
        // FIX: Add null checks for r.starters and r.bench to prevent runtime errors
        // if the database returns null instead of an empty array.
        const ownerRoster = rosters.find(r => 
            (r.starters && r.starters.includes(player.id)) || 
            (r.bench && r.bench.includes(player.id))
        );
        const ownerTeam = ownerRoster ? teams.find(t => t.id === ownerRoster.teamId) : null;
        return { ...player, ownerTeamName: ownerTeam?.name ?? null };
    });
  });

  private myRoster = computed(() => this.supabase.getMyRoster());

  filteredPlayers = computed(() => {
    const pos = this.filterPosition();
    const allPlayers = this.players();
    
    if (pos === 'FREE') {
      return allPlayers.filter(p => !p.ownerTeamName);
    }
    
    return allPlayers;
  });
  
  myPlayersOnRoster = computed(() => {
    const roster = this.myRoster();
    if (!roster) return [];
    const allPlayerIds = [...roster.starters, ...roster.bench];
    return allPlayerIds
      .map(id => this.supabase.getPlayerById(id))
      .filter((p): p is Player => !!p);
  });

  getTeamColorClass = this.supabase.getTeamColorClass;
  
  showPlayerDetails(player: Player) {
    this.uiService.showPlayerDetails(player);
  }

  openAddPlayerModal(player: PlayerWithOwner) {
    if (player.ownerTeamName) return;
    this.selectedPlayerToAdd.set(player);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.selectedPlayerToAdd.set(null);
    this.playerToDropId.set(null);
  }

  async confirmAddDrop() {
    const playerToAdd = this.selectedPlayerToAdd();
    const playerToDrop = this.playerToDropId();

    if (!playerToAdd || !playerToDrop) return;

    await this.supabase.addDropPlayer(playerToAdd.id, playerToDrop);
    await this.supabase.refreshData();
    
    this.closeModal();
    
    this.transactionSuccess.set(true);
    setTimeout(() => this.transactionSuccess.set(false), 3000);
  }
}
