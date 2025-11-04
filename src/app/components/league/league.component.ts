import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';
import { Team } from '../../services/types';
import { Router, RouterLink } from '@angular/router';

type ActiveTab = 'standings' | 'settings';

@Component({
  selector: 'app-league',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './league.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeagueComponent {
  private supabase: SupabaseService = inject(SupabaseService);
  private router: Router = inject(Router);

  activeTab = signal<ActiveTab>('standings');
  teams = computed(() => this.supabase.getTeams());
  myTeamId = computed(() => this.supabase.getLoggedInTeamId());

  sortedTeams = computed(() => {
    return [...this.teams()].sort((a, b) => {
      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }
      return b.pointsFor - a.pointsFor;
    });
  });

  getTeamColorClass = this.supabase.getTeamColorClass;

  async logout() {
    await this.supabase.logout();
    this.router.navigate(['/login']);
  }

  proposeTrade(teamId: number) {
    this.router.navigate(['/trade', teamId]);
  }
}
