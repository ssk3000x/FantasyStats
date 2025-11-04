import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { Player, Roster, Team } from '../../services/types';
import { map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { UiService } from '../../services/ui.service';

@Component({
  selector: 'app-trade',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './trade.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TradeComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private supabase = inject(SupabaseService);
  private uiService = inject(UiService);

  // Modal states
  showMyPlayersModal = signal(false);
  showOpponentPlayersModal = signal(false);

  myTeam = signal<Team | null>(this.supabase.getMyTeam());
  myRoster = signal<Roster | null>(this.supabase.getMyRoster());

  opponentTeamId$ = this.route.params.pipe(map(params => parseInt(params['teamId'], 10)));
  opponentTeam = toSignal(this.opponentTeamId$.pipe(
    map(id => this.supabase.getTeamById(id) ?? null)
  ));
  opponentRoster = toSignal(this.opponentTeamId$.pipe(
    map(id => this.supabase.getRosterForTeam(id) ?? null)
  ));

  myPlayersToOffer = signal<Player[]>([]);
  theirPlayersToRequest = signal<Player[]>([]);

  private getPlayersFromRoster(roster: Roster | null): Player[] {
    if (!roster) return [];
    const playerIds = [...roster.starters, ...roster.bench];
    return playerIds
      .map(id => this.supabase.getPlayerById(id))
      .filter((p): p is Player => !!p);
  }

  myRosterPlayers = computed(() => this.getPlayersFromRoster(this.myRoster()));
  opponentRosterPlayers = computed(() => this.getPlayersFromRoster(this.opponentRoster()));

  // Methods to check if a player is in the trade
  isPlayerOffered(player: Player): boolean {
    return this.myPlayersToOffer().some(p => p.id === player.id);
  }

  isPlayerRequested(player: Player): boolean {
    return this.theirPlayersToRequest().some(p => p.id === player.id);
  }

  // Toggle players for adding/removing from the selection modal
  toggleMyPlayer(player: Player) {
    if (this.isPlayerOffered(player)) {
      this.myPlayersToOffer.update(players => players.filter(p => p.id !== player.id));
    } else {
      this.myPlayersToOffer.update(players => [...players, player]);
    }
  }

  toggleTheirPlayer(player: Player) {
    if (this.isPlayerRequested(player)) {
      this.theirPlayersToRequest.update(players => players.filter(p => p.id !== player.id));
    } else {
      this.theirPlayersToRequest.update(players => [...players, player]);
    }
  }
  
  // Remove players from the main trade view
  removePlayerFromOffer(player: Player) {
     this.myPlayersToOffer.update(players => players.filter(p => p.id !== player.id));
  }
  
  removePlayerFromRequest(player: Player) {
      this.theirPlayersToRequest.update(players => players.filter(p => p.id !== player.id));
  }

  isTradeValid = computed(() => {
    const offeredCount = this.myPlayersToOffer().length;
    return offeredCount > 0 && offeredCount === this.theirPlayersToRequest().length;
  });

  async proposeTrade() {
    if (!this.isTradeValid()) return;
    const opponentTeam = this.opponentTeam();
    if (!opponentTeam) return;

    await this.supabase.createTradeProposal(
      opponentTeam.id,
      this.myPlayersToOffer().map(p => p.id),
      this.theirPlayersToRequest().map(p => p.id)
    );
    
    this.uiService.showNotification('Trade proposal sent!', 'success');
    this.router.navigate(['/league']);
  }
  
  getTeamColorClass = this.supabase.getTeamColorClass;
}