import { Injectable, signal, computed, effect } from '@angular/core';
import { Player, Roster, ScheduledMatchup, Team, TradeProposal } from './types';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { supabaseUrl, supabaseKey } from './supabase.config';

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
  private supabase: SupabaseClient;

  // Signals as a client-side cache for DB data
  private players = signal<Player[]>([]);
  private teams = signal<Team[]>([]);
  private rosters = signal<Roster[]>([]);
  private schedule = signal<ScheduledMatchup[]>([]);
  private tradeProposals = signal<TradeProposal[]>([]);
  private currentUser = signal<User | null>(null);
  private loggedInTeamId = signal<number | null>(null);
  
  public dataLoaded = signal(false);
  public isConfigured = signal(true);

  hasPendingTrades = computed(() => {
    const myId = this.loggedInTeamId();
    if (!myId) return false;
    return this.tradeProposals().some(t => t.receivingTeamId === myId && t.status === 'pending');
  });

  constructor() {
    // FIX: Cast to string to avoid literal type comparison error when credentials are set.
    if (!supabaseUrl || (supabaseUrl as string) === 'YOUR_SUPABASE_URL' || !supabaseKey || (supabaseKey as string) === 'YOUR_SUPABASE_ANON_KEY') {
      console.error("Supabase URL or Key is not configured. Please update src/app/services/supabase.config.ts");
      this.isConfigured.set(false);
      this.supabase = {} as SupabaseClient; // Prevent app from crashing
      // Set data loaded to true to unblock the app component from its loading state
      // so it can show our configuration error component.
      this.dataLoaded.set(true);
      return;
    }
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.initialize();
  }
  
  private async initialize() {
    // Fetch initial data and user session in parallel to speed up load time.
    const [{ data: sessionData }] = await Promise.all([
      this.supabase.auth.getSession(),
      this.loadInitialData(),
    ]);

    // Set initial auth state from the session before the app renders.
    this.currentUser.set(sessionData.session?.user ?? null);
    if (sessionData.session?.user) {
      const teamId = window.sessionStorage.getItem(USER_SESSION_KEY);
      this.loggedInTeamId.set(teamId ? parseInt(teamId, 10) : null);
    }
    
    // Now that the initial state is set, set up listeners for future changes.
    this.listenForAuthStateChanges();

    // Signal that all necessary data is loaded and the app is ready to display.
    this.dataLoaded.set(true);
  }

  private async loadInitialData(): Promise<boolean> {
    try {
      // Fetch all data in parallel for faster loading, mapping snake_case cols to camelCase props
      const [players, teams, rosters, schedule, tradeProposals] = await Promise.all([
        this.supabase.from('players').select('id, name, projectedPoints:projected_points, weeklyScores:weekly_scores'),
        this.supabase.from('teams').select('id, name, wins, losses, ties, pointsFor:points_for'),
        this.supabase.from('rosters').select('teamId:team_id, starters, bench'),
        this.supabase.from('schedule').select('id, week, team1Id:team1_id, team2Id:team2_id'),
        this.supabase.from('trade_proposals').select('id, proposingTeamId:proposing_team_id, receivingTeamId:receiving_team_id, playersOffered:players_offered, playersRequested:players_requested, status')
      ]);

      this.players.set(players.data ?? []);
      this.teams.set(teams.data ?? []);
      this.rosters.set((rosters.data as any) ?? []);
      this.schedule.set((schedule.data as any) ?? []);
      this.tradeProposals.set((tradeProposals.data as any) ?? []);
      return true;
    } catch (error) {
      console.error('Failed to load initial data:', error);
      return false;
    }
  }

  /**
   * Re-fetches all league data from the database.
   * This is called on navigation to ensure data is fresh.
   */
  public async refreshData(): Promise<boolean> {
    return await this.loadInitialData();
  }

  private listenForAuthStateChanges() {
     this.supabase.auth.onAuthStateChange(async (event, session) => {
      this.currentUser.set(session?.user ?? null);
      if (session?.user) {
        // This is a simple mock: we store the teamId in session storage on login
        // and retrieve it here. A real app might fetch this from a 'profiles' table.
        const teamId = window.sessionStorage.getItem(USER_SESSION_KEY);
        this.loggedInTeamId.set(teamId ? parseInt(teamId, 10) : null);
      } else {
        this.loggedInTeamId.set(null);
        window.sessionStorage.removeItem(USER_SESSION_KEY);
      }
    });
  }

  // --- Auth ---
  // A simplified auth system using team name as a pseudo-email.
  async login(teamName: string, password: string): Promise<{ user: User | null; error: string | null }> {
    const team = this.teams().find(t => t.name.toLowerCase() === teamName.toLowerCase());
    if (!team) {
      return { user: null, error: 'Invalid team name.' };
    }
    
    const email = `${team.name.toLowerCase().replace(/\s+/g, '')}@fantasystats.app`;

    // ONLY attempt to sign in. Do NOT create an account.
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { user: null, error: "Invalid team name or password." };
    }
    
    if (data.user) {
      window.sessionStorage.setItem(USER_SESSION_KEY, team.id.toString());
      // FIX: Explicitly set the loggedInTeamId signal here to prevent a race condition
      // with the onAuthStateChange listener.
      this.loggedInTeamId.set(team.id);
    }
    
    return { user: data.user, error: null };
  }

  async logout(): Promise<void> {
    await this.supabase.auth.signOut();
    window.sessionStorage.removeItem(USER_SESSION_KEY);
    this.loggedInTeamId.set(null);
  }

  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }
  
  getLoggedInTeamId(): number | null {
      return this.loggedInTeamId();
  }

  // --- Date/Week Management ---
  getCurrentFantasyWeek(): number {
    const now = new Date();
    const currentWeek = FANTASY_WEEKS.find(w => now >= w.start && now <= w.end);
    return currentWeek ? currentWeek.week : 1;
  }
  
  getWeekStatus(week: number): 'past' | 'current' | 'future' {
      const now = new Date();
      const weekInfo = FANTASY_WEEKS.find(w => w.week === week);
      if (!weekInfo) return 'future';
      if (now > weekInfo.end) return 'past';
      if (now >= weekInfo.start && now <= weekInfo.end) return 'current';
      return 'future';
  }

  // --- Data Getters (now read from local signal cache) ---
  getPlayers(): Player[] {
    return this.players();
  }

  getPlayerById(id: number): Player | undefined {
    return this.players().find(p => p.id === id);
  }

  getPlayerActualScore(playerId: number, week: number): number {
      const weekStatus = this.getWeekStatus(week);
      if (weekStatus === 'future') return 0;
      const player = this.getPlayerById(playerId);
      return player?.weeklyScores?.[week - 1] ?? 0;
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

  getRosterForTeam(teamId: number): Roster | undefined {
    return this.rosters().find(r => r.teamId === teamId);
  }
  
  getSchedule(): ScheduledMatchup[] {
    return this.schedule();
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

  // --- Data Mutations (now write to Supabase DB) ---
  async updateRoster(starterIds: number[], benchIds: number[]): Promise<void> {
    const teamId = this.getLoggedInTeamId();
    if (!teamId) return;

    await this.supabase
      .from('rosters')
      .update({ starters: starterIds, bench: benchIds })
      .eq('team_id', teamId);
  }

  async addDropPlayer(playerToAddId: number, playerToDropId: number): Promise<void> {
    const teamId = this.getLoggedInTeamId();
    const roster = this.getMyRoster();
    if (!teamId || !roster) return;
    
    // FIX: Handle null starter/bench arrays to prevent runtime errors.
    const currentStarters = roster.starters ?? [];
    const currentBench = roster.bench ?? [];

    const newStarters = currentStarters.filter(id => id !== playerToDropId);
    const newBench = currentBench.filter(id => id !== playerToDropId);
    newBench.push(playerToAddId);

    await this.supabase
      .from('rosters')
      .update({ starters: newStarters, bench: newBench })
      .eq('team_id', teamId);
  }

  // --- Trades ---
  getTradeProposalsForTeam(teamId: number): TradeProposal[] {
    return this.tradeProposals().filter(t => t.receivingTeamId === teamId && t.status === 'pending');
  }

  async createTradeProposal(receivingTeamId: number, playersOffered: number[], playersRequested: number[]): Promise<void> {
    const proposingTeamId = this.getLoggedInTeamId();
    if (!proposingTeamId) return;

    const newProposal = {
      proposing_team_id: proposingTeamId,
      receiving_team_id: receivingTeamId,
      players_offered: playersOffered,
      players_requested: playersRequested,
      status: 'pending'
    };
    
    await this.supabase.from('trade_proposals').insert(newProposal);
  }
  
  async rejectTrade(tradeId: number): Promise<void> {
      await this.supabase
        .from('trade_proposals')
        .update({ status: 'rejected' })
        .eq('id', tradeId);
  }

  async acceptTrade(tradeId: number): Promise<{ success: boolean; error?: string }> {
    const { error } = await this.supabase.rpc('accept_trade', { trade_id_param: tradeId });
    if (error) {
      console.error('Error accepting trade:', error);
      return { success: false, error: error.message };
    }
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
