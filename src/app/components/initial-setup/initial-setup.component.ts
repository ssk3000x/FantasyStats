import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { SupabaseService } from '../../services/supabase.service';
import { UiService } from '../../services/ui.service';
import { Player, Roster, Team } from '../../services/types';

interface DisplayPlayer extends Player {
  actualScore: number;
  projectedScore: number;
}

@Component({
  selector: 'app-team-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './initial-setup.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamDetailComponent {
  // FIX: Add explicit types for injected services to resolve 'unknown' type errors.
  private route: ActivatedRoute = inject(ActivatedRoute);
  private router: Router = inject(Router);
  supabase: SupabaseService = inject(SupabaseService);
  uiService: UiService = inject(UiService);

  // This is the team being viewed from the URL
  viewedTeamId = toSignal(this.route.params.pipe(map(params => parseInt(params['teamId'], 10))));

  // This is the logged in user's team
  myTeamId = signal(this.supabase.getLoggedInTeamId());
  
  // Computed property to check if it's the user's own team
  isMyTeam = computed(() => {
      const viewedId = this.viewedTeamId();
      const myId = this.myTeamId();
      return viewedId !== undefined && myId !== null && viewedId === myId;
  });

  team = computed(() => {
    const id = this.viewedTeamId();
    // FIX: Add type check to narrow `id` from `unknown` to `number`.
    if (typeof id !== 'number' || isNaN(id)) return null;
    return this.supabase.getTeamById(id) ?? null;
  });
  
  roster = computed(() => {
    const id = this.viewedTeamId();
    // FIX: Add type check to narrow `id` from `unknown` to `number`.
    if (typeof id !== 'number' || isNaN(id)) return null;
    return this.supabase.getRosterForTeam(id) ?? null;
  });

  private populatePlayersWithScores(playerIds: number[]): DisplayPlayer[] {
    const currentWeek = this.supabase.getCurrentFantasyWeek();
    return playerIds
      .map(id => {
        const player = this.supabase.getPlayerById(id);
        if (!player) return null;
        return {
          ...player,
          actualScore: this.supabase.getPlayerActualScore(player.id, currentWeek),
          projectedScore: this.supabase.getPlayerProjectedScore(player.id, currentWeek),
        };
      })
      .filter((p): p is DisplayPlayer => !!p);
  }

  starters = computed(() => {
    const r = this.roster();
    if (!r) return [];
    return this.populatePlayersWithScores(r.starters);
  });

  bench = computed(() => {
    const r = this.roster();
    if (!r) return [];
    return this.populatePlayersWithScores(r.bench);
  });
  
  teamColorClass = computed(() => {
      const t = this.team();
      return t ? this.supabase.getTeamColorClass(t.name) : 'text-white';
  });

  showPlayerDetails(player: Player) {
    this.uiService.showPlayerDetails(player, this.team()?.name);
  }

  proposeTrade(teamId: number) {
    this.router.navigate(['/trade', teamId]);
  }
}
