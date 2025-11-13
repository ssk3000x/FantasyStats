import { Injectable, signal, computed, effect } from '@angular/core';
import { Player, Roster, ScheduledMatchup, Team, TradeProposal } from './types';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { supabaseUrl, supabaseKey } from './supabase.config';

const USER_SESSION_KEY = 'fantasy_user_team_id';

// Define the date ranges for each week
const FANTASY_WEEKS = [
  { week: 1, start: new Date(`2025-11-09T00:00:00Z`), end: new Date(`2025-11-15T23:59:59Z`) },
  { week: 2, start: new Date(`2025-11-17T00:00:00Z`), end: new Date(`2025-11-23T23:59:59Z`) },
  { week: 3, start: new Date(`2025-11-25T00:00:00Z`), end: new Date(`2025-12-01T23:59:59Z`) },
  { week: 4, start: new Date(`2025-12-03T00:00:00Z`), end: new Date(`2025-12-09T23:59:59Z`) },
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
  }

  // --- Getters for readonly data ---
  isAuthenticated = computed(() => !!this.currentUser());
  getLoggedInTeamId = () => this.loggedInTeamId();
  
  getPlayers = () => this.players();
  getTeams = () => this.teams();
  getRosters = () => this.rosters();
  
  getMyTeam = computed(() => {
    const id = this.getLoggedInTeamId();
    if (!id) return null;
    return this.getTeamById(id);
  });

  getMyRoster = computed(() => {
    const id = this.getLoggedInTeamId();
    if (!id) return null;
    return this.getRosterForTeam(id);
  });
  
  getPlayerById = (id: number) => this.players().find(p => p.id === id) ?? null;
  getTeamById = (id: number) => this.teams().find(t => t.id === id) ?? null;
  getRosterForTeam = (teamId: number) => this.rosters().find(r => r.teamId === teamId) ?? null;

  getTradeProposalsForTeam = (teamId: number) => this.tradeProposals().filter(
    t => t.receivingTeamId === teamId && t.status === 'pending'
  );

  getMatchupsForWeek = (week: number) => this.schedule().filter(m => m.week === week);
  
  // --- Date and Score Logic ---
  getCurrentFantasyWeek(): number {
    const now = new Date();
    const currentWeek = FANTASY_WEEKS.find(w => now >= w.start && now <= w.end);
    if (currentWeek) {
      return currentWeek.week;
    }
    // If not in any week, find the next upcoming week
    const nextWeek = FANTASY_WEEKS.find(w => now < w.start);
    if (nextWeek) {
        return nextWeek.week;
    }
    // Otherwise, default to the last week of the season if it's over
    return FANTASY_WEEKS[FANTASY_WEEKS.length - 1]?.week ?? 1;
  }

  getTotalFantasyWeeks(): number {
    return FANTASY_WEEKS.length;
  }
  
  getWeekStatus(week: number): 'past' | 'current' | 'future' {
    const now = new Date();
    const weekInfo = FANTASY_WEEKS.find(w => w.week === week);
    if (!weekInfo) return 'future';

    if (now > weekInfo.end) return 'past';
    if (now >= weekInfo.start && now <= weekInfo.end) return 'current';
    return 'future';
  }

  getPlayerActualScore(playerId: number, week: number): number {
    const weekStatus = this.getWeekStatus(week);
    if (weekStatus === 'future') return 0;
    
    const player = this.getPlayerById(playerId);
    return player?.weeklyScores?.[week - 1] ?? 0;
  }
  
  getPlayerProjectedScore(playerId: number, week: number): number {
    const player = this.getPlayerById(playerId);
    if (!player) return 0;
    
    // Base score is last week's score, or current week's score if it's week 1.
    const baseScore = week > 1 
      ? player.weeklyScores?.[week - 2] ?? player.weeklyScores?.[week - 1] ?? player.projectedPoints
      : player.weeklyScores?.[week - 1] ?? player.projectedPoints;
      
    // Add a random variance between -3.0 and +3.0
    const variance = (Math.random() * 6) - 3;
    const projected = Math.max(0, baseScore + variance);
    
    return parseFloat(projected.toFixed(1));
  }

  // --- Team Appearance ---
  getTeamColorClass(teamName: string): string {
    const hash = teamName.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
    const colors = ['text-team-pink', 'text-team-green', 'text-team-purple', 'text-team-blue'];
    return colors[Math.abs(hash) % colors.length];
  }

  // --- Roster Management ---
  async updateRoster(starterIds: number[], benchIds: number[]): Promise<void> {
    const teamId = this.getLoggedInTeamId();
    if (!teamId) return;

    await this.supabase
      .from('rosters')
      .update({ starters: starterIds, bench: benchIds })
      .eq('team_id', teamId);
  }
  
  async addDropPlayer(playerIdToAdd: number, playerIdToDrop: number): Promise<void> {
    const roster = this.getMyRoster();
    if (!roster) return;

    // Create new arrays
    const newStarters = roster.starters.filter(id => id !== playerIdToDrop);
    const newBench = roster.bench.filter(id => id !== playerIdToDrop);
    
    // Add the new player to the bench
    newBench.push(playerIdToAdd);

    await this.updateRoster(newStarters, newBench);
  }

  // --- Trade Logic ---
  async createTradeProposal(receivingTeamId: number, playersOfferedIds: number[], playersRequestedIds: number[]): Promise<void> {
    const proposingTeamId = this.getLoggedInTeamId();
    if (!proposingTeamId) return;
    
    await this.supabase.from('trade_proposals').insert({
      proposing_team_id: proposingTeamId,
      receiving_team_id: receivingTeamId,
      players_offered: playersOfferedIds,
      players_requested: playersRequestedIds,
      status: 'pending'
    });
  }

  async rejectTrade(tradeId: number): Promise<void> {
    await this.supabase.from('trade_proposals').update({ status: 'rejected' }).eq('id', tradeId);
  }

  async acceptTrade(tradeId: number): Promise<{ success: boolean }> {
    // We use a Supabase RPC function to handle the trade atomically.
    const { error } = await this.supabase.rpc('accept_trade', {
      trade_id: tradeId
    });

    if (error) {
      console.error('Error accepting trade:', error);
      return { success: false };
    }
    return { success: true };
  }
}
