import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { SupabaseService } from '../../services/supabase.service';
import { UiService } from '../../services/ui.service';
import { Player, Roster, Team, TradeProposal } from '../../services/types';

interface TradeProposalDetails {
  id: number;
  proposingTeam: Team;
  playersOffered: Player[];
  playersRequested: Player[];
}

interface DisplayPlayer extends Player {
  actualScore: number;
  projectedScore: number;
}

@Component({
  selector: 'app-my-team',
  standalone: true,
  imports: [],
  templateUrl: './my-team.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyTeamComponent {
  private supabase: SupabaseService = inject(SupabaseService);
  private uiService: UiService = inject(UiService);

  myTeam = computed(() => this.supabase.getMyTeam());
  myRoster = computed(() => this.supabase.getMyRoster());
  isEditing = signal(false);
  
  // For editing state
  tempStarters = signal<DisplayPlayer[]>([]);
  tempBench = signal<DisplayPlayer[]>([]);

  pendingTrades = computed<TradeProposalDetails[]>(() => {
    const myTeamId = this.supabase.getLoggedInTeamId();
    if (!myTeamId) return [];

    const proposals = this.supabase.getTradeProposalsForTeam(myTeamId);
    return proposals.map(p => {
      const proposingTeam = this.supabase.getTeamById(p.proposingTeamId);
      // Ensure proposing team exists to prevent runtime errors
      if (!proposingTeam) {
        console.warn(`Could not find team with id ${p.proposingTeamId} for trade ${p.id}`);
        return null;
      }
      return {
        id: p.id,
        proposingTeam: proposingTeam,
        playersOffered: this.populatePlayers(p.playersOffered),
        playersRequested: this.populatePlayers(p.playersRequested),
      };
    }).filter((t): t is TradeProposalDetails => t !== null);
  });

  private populatePlayers(playerIds: number[]): Player[] {
    return playerIds
      .map(id => this.supabase.getPlayerById(id))
      .filter((p): p is Player => !!p);
  }

  private populatePlayersWithScores(playerIds: number[]): DisplayPlayer[] {
    const currentWeek = this.supabase.getCurrentFantasyWeek();
    return playerIds
      .map(id => {
          const player = this.supabase.getPlayerById(id);
          if (!player) return null;
          return {
              ...player,
              actualScore: this.supabase.getPlayerActualScore(player.id, currentWeek),
              projectedScore: this.supabase.getPlayerProjectedScore(player.id, currentWeek)
          };
      })
      .filter((p): p is DisplayPlayer => !!p);
  }

  starters = computed(() => {
    const roster = this.myRoster();
    if (!roster) return [];
    return this.populatePlayersWithScores(roster.starters);
  });
  
  bench = computed(() => {
    const roster = this.myRoster();
    if (!roster) return [];
    return this.populatePlayersWithScores(roster.bench);
  });
  
  teamColorClass = computed(() => {
      const team = this.myTeam();
      return team ? this.supabase.getTeamColorClass(team.name) : 'text-white';
  });

  toggleEdit() {
    if (this.isEditing()) {
      // Cancel edit
      this.isEditing.set(false);
    } else {
      // Start editing
      this.tempStarters.set([...this.starters()]);
      this.tempBench.set([...this.bench()]);
      this.isEditing.set(true);
    }
  }
  
  async saveRoster() {
    const newStarterIds = this.tempStarters().map(p => p.id);
    const newBenchIds = this.tempBench().map(p => p.id);
    
    await this.supabase.updateRoster(newStarterIds, newBenchIds);
    const refreshed = await this.supabase.refreshData();

    this.isEditing.set(false);
    if (refreshed) {
      this.uiService.showNotification('Roster saved!', 'success');
    } else {
      this.uiService.showNotification('Roster saved, but failed to refresh data. Please reload.', 'error', 5000);
    }
  }
  
  isRosterValid = computed(() => this.tempStarters().length === 4);
  canMoveToStarters = computed(() => this.tempStarters().length < 4);

  moveToStarters(player: DisplayPlayer) {
    if (!this.canMoveToStarters()) return;
    this.tempBench.update(b => b.filter(p => p.id !== player.id));
    this.tempStarters.update(s => [...s, player]);
  }

  moveToBench(player: DisplayPlayer) {
    this.tempStarters.update(s => s.filter(p => p.id !== player.id));
    this.tempBench.update(b => [...b, player]);
  }
  
  showPlayerDetails(player: Player) {
    this.uiService.showPlayerDetails(player);
  }

  async acceptTrade(tradeId: number) {
    const result = await this.supabase.acceptTrade(tradeId);
    if (result.success) {
      const refreshed = await this.supabase.refreshData();
      if (refreshed) {
        this.uiService.showNotification('Trade accepted!', 'success');
      } else {
        this.uiService.showNotification('Trade accepted, but failed to refresh data. Please reload.', 'error', 5000);
      }
    } else {
      this.uiService.showNotification('Failed to accept trade.', 'error');
    }
  }

  async rejectTrade(tradeId: number) {
    await this.supabase.rejectTrade(tradeId);
    const refreshed = await this.supabase.refreshData();
    if (refreshed) {
      this.uiService.showNotification('Trade rejected.', 'success');
    } else {
      this.uiService.showNotification('Trade rejected, but failed to refresh data. Please reload.', 'error', 5000);
    }
  }
}
