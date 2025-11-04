// Defining the data models for the application.
export interface Player {
  id: number;
  name: string;
  imageUrl: string;
  projectedPoints: number;
  weeklyScores?: number[];
}

export interface Team {
  id: number;
  name: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
}

export interface Roster {
  teamId: number;
  starters: number[]; // array of player ids
  bench: number[]; // array of player ids
}

export interface Matchup {
  week: number;
  team1Id: number;
  team2Id: number;
}

export interface ScheduledMatchup {
  week: number;
  team1Id: number;
  team2Id: number;
}