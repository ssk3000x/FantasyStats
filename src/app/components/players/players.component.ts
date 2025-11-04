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
  // FIX: Add explicit types to injected services
  private supabase: SupabaseService = inject(SupabaseService);
  private uiService: UiService = inject(UiService);

  isLoading = signal(true);
  players = signal<PlayerWithOwner[]>([]);
  myRoster = signal<Roster | null>(null);
  filterPosition = signal<PlayerFilter>('FREE');

  isModalOpen = signal(false);
  selectedPlayerToAdd = signal<Player | null>(null);
  playerToDropId = signal<number | null>(null);
  
  transactionSuccess = signal(false);

  positions: PlayerFilter[] = ['FREE', 'ALL'];

  filteredPlayers = computed(() => {
    const pos = this.filterPosition();
    const allPlayers = this.players();
    
    if (pos === 'FREE') {
      return allPlayers.filter(p => !p.ownerTeamName);
    }
    
    return allPlayers;
  });
  
  myBench = computed(() => {
    const roster = this.myRoster();
    if (!roster) return [];
    return roster.bench.map(id => this.supabase.getPlayerById(id)).filter((p): p is Player => !!p);
  });

  getTeamColorClass = this.supabase.getTeamColorClass;

  constructor() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    // FIX: The service methods getPlayers, getRosters, and getTeams return arrays directly, not Observables.
    // Removed nested .subscribe() calls and replaced with direct assignment.
    const players = this.supabase.getPlayers();
    const rosters = this.supabase.getRosters();
    const teams = this.supabase.getTeams();

    const populatedPlayers = players.map(player => {
        const ownerRoster = rosters.find(r => r.starters.includes(player.id) || r.bench.includes(player.id));
        const ownerTeam = ownerRoster ? teams.find(t => t.id === ownerRoster.teamId) : null;
        return { ...player, ownerTeamName: ownerTeam?.name ?? null };
    });
    this.players.set(populatedPlayers);
    this.myRoster.set(this.supabase.getMyRoster());
    this.isLoading.set(false);
  }
  
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
    this.closeModal();
    this.loadData(); // Refresh data
    
    this.transactionSuccess.set(true);
    setTimeout(() => this.transactionSuccess.set(false), 3000);
  }
}