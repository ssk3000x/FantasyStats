import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';
import { UiService } from '../../services/ui.service';
import { Player, Roster, Team } from '../../services/types';

@Component({
  selector: 'app-my-team',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-team.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyTeamComponent {
  private supabase = inject(SupabaseService);
  private uiService = inject(UiService);

  myTeam = signal<Team | null>(null);
  myRoster = signal<Roster | null>(null);
  isEditing = signal(false);
  
  // For editing state
  tempStarters = signal<Player[]>([]);
  tempBench = signal<Player[]>([]);

  constructor() {
    this.myTeam.set(this.supabase.getMyTeam());
    this.myRoster.set(this.supabase.getMyRoster());
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
  }
  
  canMoveToStarters = computed(() => this.tempStarters().length < 3);
  canMoveToBench = computed(() => this.tempBench().length < 1);

  moveToStarters(player: Player) {
    if (!this.canMoveToStarters()) return;
    this.tempBench.update(b => b.filter(p => p.id !== player.id));
    this.tempStarters.update(s => [...s, player]);
  }

  moveToBench(player: Player) {
    if (!this.canMoveToBench()) return;
    this.tempStarters.update(s => s.filter(p => p.id !== player.id));
    this.tempBench.update(b => [...b, player]);
  }
  
  showPlayerDetails(player: Player) {
    this.uiService.showPlayerDetails(player);
  }
}
