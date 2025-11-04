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

@Component({
  selector: 'app-my-team',
  standalone: true,
  imports: [],
  templateUrl: './my-team.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyTeamComponent {
  // FIX: Add explicit types to injected services
  private supabase: SupabaseService = inject(SupabaseService);
  private uiService: UiService = inject(UiService);

  myTeam = signal<Team | null>(null);
  myRoster = signal<Roster | null>(null);
  isEditing = signal(false);
  
  // For editing state
  tempStarters = signal<Player[]>([]);
  tempBench = signal<Player[]>([]);

  pendingTrades = signal<TradeProposalDetails[]>([]);

  constructor() {
    this.loadTeamData();
    this.loadTradeProposals();
  }

  loadTeamData() {
    this.myTeam.set(this.supabase.getMyTeam());
    this.myRoster.set(this.supabase.getMyRoster());
  }

  loadTradeProposals() {
    const myTeamId = this.supabase.getLoggedInTeamId();
    if (!myTeamId) return;

    const proposals = this.supabase.getTradeProposalsForTeam(myTeamId);
    const detailedProposals = proposals.map(p => ({
      id: p.id,
      proposingTeam: this.supabase.getTeamById(p.proposingTeamId)!,
      playersOffered: this.populatePlayers(p.playersOffered),
      playersRequested: this.populatePlayers(p.playersRequested),
    }));
    this.pendingTrades.set(detailedProposals);
  }

  private populatePlayers(playerIds: number[]): Player[] {
    return playerIds
      .map(id => this.supabase.getPlayerById(id))
      .filter((p): p is Player => !!p);
  }

  starters = computed(() => {
    const roster = this.myRoster();
    if (!roster) return [];
    return this.populatePlayers(roster.starters);
  });
  
  bench = computed(() => {
    const roster = this.myRoster();
    if (!roster) return [];
    return this.populatePlayers(roster.bench);
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

    // Update local state after saving
    this.myRoster.set(this.supabase.getMyRoster());
    this.isEditing.set(false);
    this.uiService.showNotification('Roster saved!', 'success');
  }
  
  isRosterValid = computed(() => this.tempStarters().length === 3);
  canMoveToStarters = computed(() => this.tempStarters().length < 3);

  moveToStarters(player: Player) {
    if (!this.canMoveToStarters()) return;
    this.tempBench.update(b => b.filter(p => p.id !== player.id));
    this.tempStarters.update(s => [...s, player]);
  }

  moveToBench(player: Player) {
    this.tempStarters.update(s => s.filter(p => p.id !== player.id));
    this.tempBench.update(b => [...b, player]);
  }
  
  showPlayerDetails(player: Player) {
    this.uiService.showPlayerDetails(player);
  }

  async acceptTrade(tradeId: number) {
    const result = await this.supabase.acceptTrade(tradeId);
    if (result.success) {
      this.uiService.showNotification('Trade accepted!', 'success');
      this.loadTeamData();
      this.loadTradeProposals();
    } else {
      this.uiService.showNotification('Failed to accept trade.', 'error');
    }
  }

  async rejectTrade(tradeId: number) {
    await this.supabase.rejectTrade(tradeId);
    this.uiService.showNotification('Trade rejected.', 'success');
    this.loadTradeProposals();
  }
}
