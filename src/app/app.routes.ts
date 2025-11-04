import { Routes } from '@angular/router';
import { authGuard, loginGuard } from './guards/auth.guard';
import { LoginComponent } from './components/login/login.component';
import { MyTeamComponent } from './components/my-team/my-team.component';
import { MatchupComponent } from './components/matchup/matchup.component';
import { PlayersComponent } from './components/players/players.component';
import { LeagueComponent } from './components/league/league.component';

export const APP_ROUTES: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [loginGuard]
  },
  {
    path: 'my-team',
    component: MyTeamComponent,
    canActivate: [authGuard]
  },
  {
    path: 'matchup',
    component: MatchupComponent,
    canActivate: [authGuard]
  },
  {
    path: 'players',
    component: PlayersComponent,
    canActivate: [authGuard]
  },
  {
    path: 'league',
    component: LeagueComponent,
    canActivate: [authGuard]
  },
  {
    path: '',
    redirectTo: '/my-team',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/my-team'
  }
];
