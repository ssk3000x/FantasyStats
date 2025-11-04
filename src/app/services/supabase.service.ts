import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MOCK_DATA } from './mock-data';
import { Player, Team, Roster, ScheduledMatchup } from './types';

const SESSION_KEY = 'fantasy-user-team-id';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private players = signal(MOCK_DATA.players);
  private teams = signal(MOCK_DATA.teams);
  private rosters = signal(MOCK_DATA.rosters);
  private schedule = signal(MOCK_DATA.schedule);
  
  private currentFantasyWeek = signal(1); // Default to week 1

  constructor(private router: Router) {}

  // --- Auth ---
  login(teamName: string, password_unused: string): Promise<{ user: { id: number } | null, error: string | null }> {
    const team = this.teams().find(t => t.name.toLowerCase() === teamName.toLowerCase());
    // In a real app, you'd hash and compare the password. Here, it's a simple check.
    if (team && password_unused === '1234') {
      localStorage.setItem(SESSION_KEY, team.id.toString());
      return Promise.resolve({ user: { id: team.id }, error: null });
    }
    return Promise.resolve({ user: null, error: 'Invalid team name or password.' });
  }

  logout(): void {
    localStorage.removeItem(SESSION_KEY);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(SESSION_KEY);
  }
  
  // --- Current User ---
  getMyTeamId(): number | null {
    const id = localStorage.getItem(SESSION_KEY);
    return id ? parseInt(id, 10) : null;
  }

  getMyTeam(): Team | null {
    const myTeamId = this.getMyTeamId();
    if (!myTeamId) return null;
    return this.teams().find(t => t.id === myTeamId) ?? null;
  }

  getMyRoster(): Roster | null {
    const myTeamId = this.getMyTeamId();
    if (!myTeamId) return null;
    return this.rosters().find(r => r.teamId === myTeamId) ?? null;
  }

  // --- Data Access ---
  getPlayers(): Player[] {
    return this.players();
  }

  getPlayerById(id: number): Player | undefined {
    return this.players().find(p => p.id === id);
  }

  getTeams(): Team[] {
    return this.teams();
  }

  getTeamById(id: number): Team | undefined {
    return this.teams().find(t => t.id === id);
  }
  
  getRosters(): Roster[] {
    return this.rosters();
  }

  getRosterByTeamId(teamId: number): Roster | undefined {
    return this.rosters().find(r => r.teamId === teamId);
  }

  getMatchupForTeam(teamId: number, week: number): ScheduledMatchup | undefined {
    return this.schedule().find(m => m.week === week && (m.team1Id === teamId || m.team2Id === teamId));
  }
  
  // --- Roster Management ---
  async addDropPlayer(playerToAddId: number, playerToDropId: number): Promise<void> {
    const myTeamId = this.getMyTeamId();
    if (!myTeamId) {
      return Promise.reject('User not found');
    }
    
    // Check if player is already owned
    const isOwned = this.rosters().some(r => r.starters.includes(playerToAddId) || r.bench.includes(playerToAddId));
    if (isOwned) {
      return Promise.reject('Player is already on a roster.');
    }

    this.rosters.update(rosters => {
      const myRoster = rosters.find(r => r.teamId === myTeamId);
      if (myRoster) {
        const dropIndex = myRoster.bench.indexOf(playerToDropId);
        if (dropIndex > -1) {
          myRoster.bench.splice(dropIndex, 1);
          myRoster.bench.push(playerToAddId);
        }
      }
      return rosters;
    });
    return Promise.resolve();
  }
  
  async updateRoster(newStarters: number[], newBench: number[]): Promise<void> {
    const myTeamId = this.getMyTeamId();
    if (!myTeamId) {
      return Promise.reject('User not found');
    }

    this.rosters.update(rosters => {
      const myRoster = rosters.find(r => r.teamId === myTeamId);
      if (myRoster) {
        myRoster.starters = newStarters;
        myRoster.bench = newBench;
      }
      return rosters;
    });
    return Promise.resolve();
  }

  // --- UI Helpers ---
  getTeamColorClass(teamName: string | null): string {
    if (!teamName) return 'text-gray-400';
    switch (teamName.toLowerCase()) {
      case 'swarchis': return 'text-team-pink';
      case 'gabriel': return 'text-team-green';
      case 'rihito': return 'text-team-purple';
      case 'daniel': return 'text-team-blue';
      default: return 'text-white';
    }
  }
}
