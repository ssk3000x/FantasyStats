import { Component, ChangeDetectionStrategy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';
import { UiService } from '../../services/ui.service';
import { Player, Team, Roster } from '../../services/types';

interface TeamDetails {
  team: Team;
  starters: Player[];
  projectedScore: number;
}

interface ComparisonRow {
  team1Player: Player | null;
  team2Player: Player | null;
}

@Component({
  selector: 'app-matchup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './matchup.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchupComponent {
  private supabase = inject(SupabaseService);
  private uiService = inject(UiService);

  currentWeek = signal(1);
  myTeamDetails = signal<TeamDetails | null>(null);
  opponentDetails = signal<TeamDetails | null>(null);

  constructor() {
    effect(() => {
      this.loadMatchup(this.currentWeek());
    });
  }

  loadMatchup(week: number) {
    const myTeamId = this.supabase.getMyTeamId();
    if (!myTeamId) return;

    const matchup = this.supabase.getMatchupForTeam(myTeamId, week);
    if (!matchup) {
      this.myTeamDetails.set(null);
      this.opponentDetails.set(null);
      return;
    }

    const myTeam = this.supabase.getTeamById(myTeamId);
    const opponentId = matchup.team1Id === myTeamId ? matchup.team2Id : matchup.team1Id;
    const opponentTeam = this.supabase.getTeamById(opponentId);

    if (!myTeam || !opponentTeam) return;

    this.myTeamDetails.set(this.getTeamDetails(myTeam));
    this.opponentDetails.set(this.getTeamDetails(opponentTeam));
  }

  private getTeamDetails(team: Team): TeamDetails {
    const roster = this.supabase.getRosterByTeamId(team.id);
    const starters = roster ? this.populatePlayers(roster.starters) : [];
    const projectedScore = starters.reduce((sum, p) => sum + p.projectedPoints, 0);
    return { team, starters, projectedScore };
  }

  private populatePlayers(playerIds: number[]): Player[] {
    return playerIds
      .map(id => this.supabase.getPlayerById(id))
      .filter((p): p is Player => !!p);
  }

  comparisonRows = computed((): ComparisonRow[] => {
    const team1Starters = this.myTeamDetails()?.starters ?? [];
    const team2Starters = this.opponentDetails()?.starters ?? [];
    
    const maxRows = Math.max(team1Starters.length, team2Starters.length);
    const rows: ComparisonRow[] = [];

    for (let i = 0; i < maxRows; i++) {
      rows.push({
        team1Player: team1Starters[i] || null,
        team2Player: team2Starters[i] || null,
      });
    }
    return rows;
  });

  getTeamColorClass = this.supabase.getTeamColorClass;
  
  showPlayerDetails(player: Player) {
    this.uiService.showPlayerDetails(player);
  }
}
