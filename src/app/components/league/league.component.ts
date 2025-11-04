import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';
import { Team } from '../../services/types';
import { Router } from '@angular/router';

type ActiveTab = 'standings' | 'settings';

@Component({
  selector: 'app-league',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './league.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeagueComponent {
  // FIX: Add explicit types to injected services
  private supabase: SupabaseService = inject(SupabaseService);
  private router: Router = inject(Router);

  activeTab = signal<ActiveTab>('standings');
  teams = signal<Team[]>([]);

  sortedTeams = computed(() => {
    return [...this.teams()].sort((a, b) => {
      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }
      return b.pointsFor - a.pointsFor;
    });
  });

  getTeamColorClass = this.supabase.getTeamColorClass;

  constructor() {
    // FIX: The service method getTeams returns an array directly, not an Observable.
    // Removed .subscribe() call and replaced with direct assignment.
    const teams = this.supabase.getTeams();
    this.teams.set(teams);
  }

  logout() {
    this.supabase.logout();
    this.router.navigate(['/login']);
  }
}