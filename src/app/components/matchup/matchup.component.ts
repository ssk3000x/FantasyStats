import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';
import { UiService } from '../../services/ui.service';
import { Player, ScheduledMatchup, Team } from '../../services/types';

interface TeamMatchupDetails {
  team: Team;
  starters: Player[];
  totalProjectedPoints: number;
  totalActualScore: number;
}

interface ComparisonRow {
  myPlayer: Player | null;
  opponentPlayer: Player | null;
  myPlayerActualScore: number;
  opponentPlayerActualScore: number;
}

@Component({
  selector: 'app-matchup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './matchup.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchupComponent {
  private supabase: SupabaseService = inject(SupabaseService);
  private uiService: UiService = inject(UiService);

  myTeamId = computed(() => this.supabase.getLoggedInTeamId());
  currentWeek = signal<number>(this.supabase.getCurrentFantasyWeek());
  
  allMatchupsForWeek = computed(() => {
    return this.supabase.getMatchupsForWeek(this.currentWeek());
  });
  
  currentMatchup = computed(() => {
    const teamId = this.myTeamId();
    if (!teamId) return null;
    const matchups = this.allMatchupsForWeek();
    return matchups.find(m => m.team1Id === teamId || m.team2Id === teamId) ?? null;
  });
  
  otherMatchupsForWeek = computed(() => {
    const myMatchup = this.currentMatchup();
    return this.allMatchupsForWeek().filter(m => m !== myMatchup);
  });

  private getTeamDetails(teamId: number | null): TeamMatchupDetails | null {
    if (!teamId) return null;

    const team = this.supabase.getTeamById(teamId);
    if (!team) return null;
    
    const roster = this.supabase.getRosters().find(r => r.teamId === teamId);
    if (!roster) return { team, starters: [], totalProjectedPoints: 0, totalActualScore: 0 };

    const starters = roster.starters
      .map(id => this.supabase.getPlayerById(id))
      .filter((p): p is Player => !!p);

    const totalProjectedPoints = starters.reduce((sum, player) => sum + player.projectedPoints, 0);
    const totalActualScore = starters.reduce((sum, p) => sum + this.supabase.getPlayerActualScore(p.id, this.currentWeek()), 0);

    return { team, starters, totalProjectedPoints, totalActualScore };
  }
  
  myTeamDetails = computed(() => this.getTeamDetails(this.myTeamId()));

  opponentTeamDetails = computed(() => {
    const matchup = this.currentMatchup();
    const myId = this.myTeamId();
    if (!matchup || !myId) return null;
    
    const opponentId = matchup.team1Id === myId ? matchup.team2Id : matchup.team1Id;
    return this.getTeamDetails(opponentId);
  });
  
  comparisonRows = computed((): ComparisonRow[] => {
      const myStarters = this.myTeamDetails()?.starters ?? [];
      const opponentStarters = this.opponentTeamDetails()?.starters ?? [];
      const numRows = Math.max(myStarters.length, opponentStarters.length);
      const rows: ComparisonRow[] = [];

      for(let i = 0; i < numRows; i++) {
        const myPlayer = myStarters[i] || null;
        const opponentPlayer = opponentStarters[i] || null;
        rows.push({
          myPlayer,
          opponentPlayer,
          myPlayerActualScore: myPlayer ? this.supabase.getPlayerActualScore(myPlayer.id, this.currentWeek()) : 0,
          opponentPlayerActualScore: opponentPlayer ? this.supabase.getPlayerActualScore(opponentPlayer.id, this.currentWeek()) : 0,
        });
      }
      return rows;
  });

  otherMatchups = computed(() => {
    return this.otherMatchupsForWeek()
      .map(matchup => {
        const team1 = this.supabase.getTeamById(matchup.team1Id);
        const team2 = this.supabase.getTeamById(matchup.team2Id);
        const team1Details = this.getTeamDetails(matchup.team1Id);
        const team2Details = this.getTeamDetails(matchup.team2Id);

        // If any data is missing, filter this matchup out to prevent crashes.
        if (!team1 || !team2 || !team1Details || !team2Details) {
          return null;
        }

        return {
          matchup,
          team1,
          team2,
          team1Score: team1Details.totalActualScore,
          team2Score: team2Details.totalActualScore,
        };
      })
      .filter((m): m is NonNullable<typeof m> => m !== null);
  });

  currentWeekStatus = computed(() => this.supabase.getWeekStatus(this.currentWeek()));
  
  changeWeek(delta: number) {
    this.currentWeek.update(w => w + delta);
  }
  
  getTeamColorClass = this.supabase.getTeamColorClass;

  showPlayerDetails(player: Player) {
    this.uiService.showPlayerDetails(player);
  }
}
