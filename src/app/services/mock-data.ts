import { Player, Team, Roster, ScheduledMatchup } from './types';

const players: Player[] = [
  // QBs
  { id: 101, name: 'Patrick Mahomes', position: 'QB', team: 'KC', imageUrl: 'https://picsum.photos/id/101/50', projectedPoints: 22.5 },
  { id: 102, name: 'Josh Allen', position: 'QB', team: 'BUF', imageUrl: 'https://picsum.photos/id/102/50', projectedPoints: 24.1 },
  { id: 103, name: 'Jalen Hurts', position: 'QB', team: 'PHI', imageUrl: 'https://picsum.photos/id/103/50', projectedPoints: 23.0 },
  { id: 104, name: 'Lamar Jackson', position: 'QB', team: 'BAL', imageUrl: 'https://picsum.photos/id/104/50', projectedPoints: 21.8 },
  { id: 105, name: 'C.J. Stroud', position: 'QB', team: 'HOU', imageUrl: 'https://picsum.photos/id/105/50', projectedPoints: 20.5 },

  // RBs
  { id: 201, name: 'Christian McCaffrey', position: 'RB', team: 'SF', imageUrl: 'https://picsum.photos/id/201/50', projectedPoints: 18.7 },
  { id: 202, name: 'Bijan Robinson', position: 'RB', team: 'ATL', imageUrl: 'https://picsum.photos/id/202/50', projectedPoints: 15.2 },
  { id: 203, name: 'Breece Hall', position: 'RB', team: 'NYJ', imageUrl: 'https://picsum.photos/id/203/50', projectedPoints: 14.8 },
  { id: 204, name: 'Kyren Williams', position: 'RB', team: 'LAR', imageUrl: 'https://picsum.photos/id/204/50', projectedPoints: 16.1 },
  { id: 205, name: 'Travis Etienne Jr.', position: 'RB', team: 'JAC', imageUrl: 'https://picsum.photos/id/205/50', projectedPoints: 13.5 },

  // WRs
  { id: 301, name: 'Justin Jefferson', position: 'WR', team: 'MIN', imageUrl: 'https://picsum.photos/id/301/50', projectedPoints: 16.5 },
  { id: 302, name: 'CeeDee Lamb', position: 'WR', team: 'DAL', imageUrl: 'https://picsum.photos/id/302/50', projectedPoints: 17.1 },
  { id: 303, name: 'Tyreek Hill', position: 'WR', team: 'MIA', imageUrl: 'https://picsum.photos/id/303/50', projectedPoints: 18.0 },
  { id: 304, name: 'Amon-Ra St. Brown', position: 'WR', team: 'DET', imageUrl: 'https://picsum.photos/id/304/50', projectedPoints: 15.8 },
  { id: 305, name: 'A.J. Brown', position: 'WR', team: 'PHI', imageUrl: 'https://picsum.photos/id/305/50', projectedPoints: 14.9 },

  // TEs
  { id: 401, name: 'Travis Kelce', position: 'TE', team: 'KC', imageUrl: 'https://picsum.photos/id/401/50', projectedPoints: 12.3 },
  { id: 402, name: 'Sam LaPorta', position: 'TE', team: 'DET', imageUrl: 'https://picsum.photos/id/402/50', projectedPoints: 10.5 },
  { id: 403, name: 'Mark Andrews', position: 'TE', team: 'BAL', imageUrl: 'https://picsum.photos/id/403/50', projectedPoints: 9.8 },
  { id: 404, name: 'George Kittle', position: 'TE', team: 'SF', imageUrl: 'https://picsum.photos/id/404/50', projectedPoints: 9.2 },
];

const teams: Team[] = [
  { id: 1, name: 'Swarchis', wins: 0, losses: 0, ties: 0, pointsFor: 0 },
  { id: 2, name: 'Gabriel', wins: 0, losses: 0, ties: 0, pointsFor: 0 },
  { id: 3, name: 'Rihito', wins: 0, losses: 0, ties: 0, pointsFor: 0 },
  { id: 4, name: 'Daniel', wins: 0, losses: 0, ties: 0, pointsFor: 0 },
];

const rosters: Roster[] = [
  // Swarchis
  { teamId: 1, starters: [101, 201, 301], bench: [401] },
  // Gabriel
  { teamId: 2, starters: [102, 202, 302], bench: [402] },
  // Rihito
  { teamId: 3, starters: [103, 203, 303], bench: [403] },
  // Daniel
  { teamId: 4, starters: [104, 204, 304], bench: [404] },
];

const schedule: ScheduledMatchup[] = [
  { week: 1, team1Id: 1, team2Id: 2 }, // Swarchis vs Gabriel
  { week: 1, team1Id: 3, team2Id: 4 }, // Rihito vs Daniel
];

export const MOCK_DATA = {
  players,
  teams,
  rosters,
  schedule,
};
