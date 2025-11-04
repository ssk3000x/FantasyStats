import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { SupabaseService } from '../../services/supabase.service';
import { UiService } from '../../services/ui.service';
import { Player, Roster, Team } from '../../services/types';

@Component({
  selector: 'app-team-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './initial-setup.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  supabase = inject(SupabaseService);
  uiService = inject(UiService);

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
    if (id === undefined) return null;
    return this.supabase.getTeamById(id) ?? null;
  });
  
  roster = computed(() => {
    const id = this.viewedTeamId();
    if (id === undefined) return null;
    return this.supabase.getRosterForTeam(id) ?? null;
  });

  private populatePlayers(playerIds: number[]): Player[] {
    return playerIds
      .map(id => this.supabase.getPlayerById(id))
      .filter((p): p is Player => !!p);
  }

  starters = computed(() => {
    const r = this.roster();
    if (!r) return [];
    return this.populatePlayers(r.starters);
  });

  bench = computed(() => {
    const r = this.roster();
    if (!r) return [];
    return this.populatePlayers(r.bench);
  });
  
  teamColorClass = computed(() => {
      const t = this.team();
      return t ? this.supabase.getTeamColorClass(t.name) : 'text-white';
  });

  showPlayerDetails(player: Player) {
    this.uiService.showPlayerDetails(player);
  }

  proposeTrade(teamId: number) {
    this.router.navigate(['/trade', teamId]);
  }
}