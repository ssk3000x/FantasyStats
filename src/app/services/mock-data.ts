import { Player, Team, Roster, ScheduledMatchup, TradeProposal } from './types';

// Updated player list based on user request.
const playerNames = [
  'Vedh Atmakuri', 'Rachel Chen', 'Isabella Cruz', 'Daniel Garcia', 'Chase Gonzalez', 
  'Isaac Icaza', 'Gabriel John', 'Rayan Khan', 'Jennifer Khong', 'Swarchis Kulkarni', 
  'Nathan Lee', 'Adalyn Lin', 'Srihita Madiraju', 'Ingrid Kope', 'Nalani Matsumura', 
  'Maxim Melisbek', 'Bhargav Nemani', 'Litong Nie', 'Julia Nikolov', 'Raahil Sengupta', 
  'Siya Shah', 'Ryan Son', 'Peter Stolc', 'Kayla Su', 'Rex Teixeira', 
  'Michael Tsudama', 'Aishwarya Vinodh', 'Sophia Weiss', 'Michael Wu', 'Chengmin Xu', 
  'Rihito Yamaguchi', 'Daniel Yeon', 'Harry Yin'
];

// Consistent player data generation
const players: Player[] = playerNames.map((name, index) => {
    const id = 101 + index;
    const nameHash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const projectedPoints = 5 + (nameHash % 200) / 10;
    const score1 = 5 + ((nameHash * 3) % 250) / 10;
    const score2 = 5 + ((nameHash * 7) % 250) / 10;

    return {
        id: id,
        name: name,
        projectedPoints: parseFloat(projectedPoints.toFixed(1)),
        weeklyScores: [parseFloat(score1.toFixed(1)), parseFloat(score2.toFixed(1))]
    };
});

const teams: Team[] = [
  { id: 1, name: 'Swarchis', wins: 0, losses: 0, ties: 0, pointsFor: 0 },
  { id: 2, name: 'Gabriel', wins: 0, losses: 0, ties: 0, pointsFor: 0 },
  { id: 3, name: 'Rihito', wins: 0, losses: 0, ties: 0, pointsFor: 0 },
  { id: 4, name: 'Daniel', wins: 0, losses: 0, ties: 0, pointsFor: 0 },
];

// Randomized starting rosters to ensure a fresh league setup.
// This is for reference and consistency; the live app uses Supabase data.
const allPlayerIds = players.map(p => p.id);
// Simple shuffle
for (let i = allPlayerIds.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [allPlayerIds[i], allPlayerIds[j]] = [allPlayerIds[j], allPlayerIds[i]];
}

const rosters: Roster[] = [
  // Swarchis
  { teamId: 1, starters: allPlayerIds.slice(0, 3), bench: allPlayerIds.slice(3, 5) },
  // Gabriel
  { teamId: 2, starters: allPlayerIds.slice(5, 8), bench: allPlayerIds.slice(8, 10) },
  // Rihito
  { teamId: 3, starters: allPlayerIds.slice(10, 13), bench: allPlayerIds.slice(13, 15) },
  // Daniel
  { teamId: 4, starters: allPlayerIds.slice(15, 18), bench: allPlayerIds.slice(18, 20) },
];


const schedule: ScheduledMatchup[] = [
  // Week 1
  { week: 1, team1Id: 1, team2Id: 2 }, // Swarchis vs Gabriel
  { week: 1, team1Id: 3, team2Id: 4 }, // Rihito vs Daniel
  // Week 2
  { week: 2, team1Id: 1, team2Id: 3 }, // Swarchis vs Rihito
  { week: 2, team1Id: 2, team2Id: 4 }, // Gabriel vs Daniel
];

const tradeProposals: TradeProposal[] = [];

export const MOCK_DATA = {
  players,
  teams,
  rosters,
  schedule,
  tradeProposals,
};