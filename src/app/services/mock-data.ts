import { Player, Team, Roster, ScheduledMatchup, TradeProposal } from './types';

const playerNames = [
  'Vedh Atmakuri', 'Rachel Chen', 'Isabella Cruz', 'Daniel Garcia', 'Chase Gonzalez', 
  'Isaac Icaza', 'Gabriel John', 'Rayan Khan', 'Jennifer Khong', 'Swarchis Kulkarni', 
  'Nathan Lee', 'Adalyn Lin', 'Jeff Lutze', 'Srihita Madiraju', 'Ingrid Kope', 
  'Nalani Matsumura', 'Maxim Melisbek', 'Bhargav Nemani', 'Litong Nie', 'Julia Nikolov', 
  'Raahil Sengupta', 'Siya Shah', 'Peter Stolc', 'Kayla Su', 'Rex Teixeira', 
  'Michael Tsudama', 'Aishwarya Vinodh', 'Sophia Weiss', 'Michael Wu', 'Chengmin Xu', 
  'Rihito Yamaguchi', 'Daniel Yeon', 'Harry Yin'
];

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

const rosters: Roster[] = [
  // Swarchis
  { teamId: 1, starters: [101, 102, 103], bench: [104, 117] },
  // Gabriel
  { teamId: 2, starters: [105, 106, 107], bench: [108, 119] },
  // Rihito
  { teamId: 3, starters: [109, 110, 111], bench: [112, 121] },
  // Daniel
  { teamId: 4, starters: [113, 114, 115], bench: [116, 123] },
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