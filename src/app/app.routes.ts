import { Routes } from '@angular/router';
import { authGuard, loginGuard } from './guards/auth.guard';
import { LoginComponent } from './components/login/login.component';
import { MyTeamComponent } from './components/my-team/my-team.component';
import { MatchupComponent } from './components/matchup/matchup.component';
import { PlayersComponent } from './components/players/players.component';
import { LeagueComponent } from './components/league/league.component';
import { TradeComponent } from './components/trade/trade.component';
import { TeamDetailComponent } from './components/initial-setup/initial-setup.component';

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
    path: 'trade/:teamId',
    component: TradeComponent,
    canActivate: [authGuard]
  },
  {
    path: 'team/:teamId',
    component: TeamDetailComponent,
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