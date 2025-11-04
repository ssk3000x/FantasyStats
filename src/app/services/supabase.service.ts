import { Injectable, signal, computed } from '@angular/core';
import { MOCK_DATA } from './mock-data';
import { Player, Roster, ScheduledMatchup, Team, TradeProposal } from './types';

const USER_SESSION_KEY = 'fantasy_user_team_id';

// Define the date ranges for each week
const nextYear = new Date().getFullYear() + 1;
const FANTASY_WEEKS = [
  { week: 1, start: new Date(`${nextYear}-09-04T00:00:00Z`), end: new Date(`${nextYear}-09-10T23:59:59Z`) },
  { week: 2, start: new Date(`${nextYear}-09-11T00:00:00Z`), end: new Date(`${nextYear}-09-17T23:59:59Z`) },
  // Add more weeks here as the season progresses
];

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private players = signal<Player[]>(MOCK_DATA.players);
  private teams = signal<Team[]>(MOCK_DATA.teams);
  private rosters = signal<Roster[]>(MOCK_DATA.rosters);
  private schedule = signal<ScheduledMatchup[]>(MOCK_DATA.schedule);
  private tradeProposals = signal<TradeProposal[]>(MOCK_DATA.tradeProposals);

  private loggedInTeamId = signal<number | null>(null);
  
  hasPendingTrades = computed(() => {
    const myId = this.loggedInTeamId();
    if (!myId) return false;
    return this.tradeProposals().some(t => t.receivingTeamId === myId && t.status === 'pending');
  });

  constructor() {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const storedId = window.sessionStorage.getItem(USER_SESSION_KEY);
      if (storedId) {
        this.loggedInTeamId.set(parseInt(storedId, 10));
      }
    }
  }

  // --- Auth ---
  async login(teamName: string, password: string): Promise<{ user: { id: number } | null; error: string | null }> {
    const team = this.teams().find(t => t.name.toLowerCase() === teamName.toLowerCase());
    if (team && password === '1234') {
      this.loggedInTeamId.set(team.id);
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(USER_SESSION_KEY, team.id.toString());
      }
      return { user: { id: team.id }, error: null };
    }
    return { user: null, error: 'Invalid team name or password.' };
  }

  logout(): void {
    this.loggedInTeamId.set(null);
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.removeItem(USER_SESSION_KEY);
    }
  }

  isAuthenticated(): boolean {
    return this.loggedInTeamId() !== null;
  }
  
  getLoggedInTeamId(): number | null {
      return this.loggedInTeamId();
  }

  // --- Date/Week Management ---
  getCurrentFantasyWeek(): number {
    const now = new Date();
    const currentWeek = FANTASY_WEEKS.find(w => now >= w.start && now <= w.end);
    return currentWeek ? currentWeek.week : 1; // Default to week 1 if not in a defined week
  }
  
  getWeekStatus(week: number): 'past' | 'current' | 'future' {
      const now = new Date();
      const weekInfo = FANTASY_WEEKS.find(w => w.week === week);
      if (!weekInfo) return 'future'; // Assume future if not defined
      if (now > weekInfo.end) return 'past';
      if (now >= weekInfo.start && now <= weekInfo.end) return 'current';
      return 'future';
  }

  // --- Data Getters ---
  getPlayers(): Player[] {
    return [...this.players()];
  }

  getPlayerById(id: number): Player | undefined {
    return this.players().find(p => p.id === id);
  }

  getPlayerActualScore(playerId: number, week: number): number {
      const weekStatus = this.getWeekStatus(week);
      if (weekStatus === 'future') {
        return 0;
      }
      const player = this.getPlayerById(playerId);
      // Week is 1-based, array is 0-based
      return player?.weeklyScores?.[week - 1] ?? 0;
  }

  getTeams(): Team[] {
    return [...this.teams()];
  }

  getTeamById(id: number): Team | undefined {
    return this.teams().find(t => t.id === id);
  }

  getRosters(): Roster[] {
    return [...this.rosters()];
  }

  getRosterForTeam(teamId: number): Roster | undefined {
    return this.rosters().find(r => r.teamId === teamId);
  }
  
  getSchedule(): ScheduledMatchup[] {
    return [...this.schedule()];
  }
  
  getMatchupsForWeek(week: number): ScheduledMatchup[] {
      return this.schedule().filter(m => m.week === week);
  }

  getMyTeam(): Team | null {
    const id = this.getLoggedInTeamId();
    if (!id) return null;
    return this.getTeamById(id) ?? null;
  }

  getMyRoster(): Roster | null {
    const id = this.getLoggedInTeamId();
    if (!id) return null;
    return this.rosters().find(r => r.teamId === id) ?? null;
  }

  // --- Data Mutations ---
  async updateRoster(starterIds: number[], benchIds: number[]): Promise<void> {
    const teamId = this.getLoggedInTeamId();
    if (!teamId) return;

    this.rosters.update(rosters => {
      const rosterIndex = rosters.findIndex(r => r.teamId === teamId);
      if (rosterIndex !== -1) {
        rosters[rosterIndex] = { ...rosters[rosterIndex], starters: starterIds, bench: benchIds };
      }
      return [...rosters];
    });
  }

  async addDropPlayer(playerToAddId: number, playerToDropId: number): Promise<void> {
    const teamId = this.getLoggedInTeamId();
    if (!teamId) return;

    this.rosters.update(rosters => {
      const rosterIndex = rosters.findIndex(r => r.teamId === teamId);
      if (rosterIndex !== -1) {
        const currentRoster = rosters[rosterIndex];
        const newBench = currentRoster.bench.filter(id => id !== playerToDropId);
        newBench.push(playerToAddId);
        rosters[rosterIndex] = { ...currentRoster, bench: newBench };
      }
      return [...rosters];
    });
  }

  // --- Trades ---
  getTradeProposalsForTeam(teamId: number): TradeProposal[] {
    return this.tradeProposals().filter(t => t.receivingTeamId === teamId && t.status === 'pending');
  }

  async createTradeProposal(receivingTeamId: number, playersOffered: number[], playersRequested: number[]): Promise<void> {
    const proposingTeamId = this.getLoggedInTeamId();
    if (!proposingTeamId) return;

    const newProposal: TradeProposal = {
      id: Date.now(), // simple unique id
      proposingTeamId,
      receivingTeamId,
      playersOffered,
      playersRequested,
      status: 'pending'
    };
    this.tradeProposals.update(proposals => [...proposals, newProposal]);
  }
  
  async rejectTrade(tradeId: number): Promise<void> {
      this.tradeProposals.update(proposals => {
          const tradeIndex = proposals.findIndex(t => t.id === tradeId);
          if (tradeIndex > -1) {
              proposals[tradeIndex].status = 'rejected';
          }
          return [...proposals];
      });
  }

  async acceptTrade(tradeId: number): Promise<{ success: boolean }> {
    const trade = this.tradeProposals().find(t => t.id === tradeId);
    if (!trade || trade.status !== 'pending') return { success: false };

    const { proposingTeamId, receivingTeamId, playersOffered, playersRequested } = trade;

    this.rosters.update(currentRosters => {
      const proposerRosterIndex = currentRosters.findIndex(r => r.teamId === proposingTeamId);
      const receiverRosterIndex = currentRosters.findIndex(r => r.teamId === receivingTeamId);

      if (proposerRosterIndex === -1 || receiverRosterIndex === -1) {
        return currentRosters;
      }

      const proposerRoster = currentRosters[proposerRosterIndex];
      const receiverRoster = currentRosters[receiverRosterIndex];

      // Remove players from original owners
      // Proposer gives away playersOffered
      const proposerNewStarters = proposerRoster.starters.filter(id => !playersOffered.includes(id));
      const proposerNewBench = proposerRoster.bench.filter(id => !playersOffered.includes(id));

      // Receiver gives away playersRequested
      const receiverNewStarters = receiverRoster.starters.filter(id => !playersRequested.includes(id));
      const receiverNewBench = receiverRoster.bench.filter(id => !playersRequested.includes(id));

      // Add players to new owners' benches
      // Proposer receives playersRequested
      proposerNewBench.push(...playersRequested);
      // Receiver receives playersOffered
      receiverNewBench.push(...playersOffered);

      // Update rosters in the array
      currentRosters[proposerRosterIndex] = { ...proposerRoster, starters: proposerNewStarters, bench: proposerNewBench };
      currentRosters[receiverRosterIndex] = { ...receiverRoster, starters: receiverNewStarters, bench: receiverNewBench };

      return [...currentRosters];
    });

    this.tradeProposals.update(proposals => {
      const tradeIndex = proposals.findIndex(t => t.id === tradeId);
      if (tradeIndex !== -1) {
        proposals[tradeIndex].status = 'accepted';
      }
      return [...proposals];
    });

    return { success: true };
  }
  
  // --- UI Helpers ---
  getTeamColorClass(teamName: string): string {
    switch (teamName.toLowerCase()) {
      case 'swarchis':
        return 'text-team-pink';
      case 'gabriel':
        return 'text-team-green';
      case 'rihito':
        return 'text-team-purple';
      case 'daniel':
        return 'text-team-blue';
      default:
        return 'text-gray-400';
    }
  }
}