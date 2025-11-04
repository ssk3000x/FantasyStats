import { Component, ChangeDetectionStrategy, effect, inject, signal } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavComponent } from './components/layout/nav/nav.component';
import { SupabaseService } from './services/supabase.service';
import { filter } from 'rxjs';
import { PlayerDetailModalComponent } from './components/shared/player-detail-modal/player-detail-modal.component';
import { UiService } from './services/ui.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavComponent, PlayerDetailModalComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  // FIX: Add explicit types to injected services
  private supabase: SupabaseService = inject(SupabaseService);
  private router: Router = inject(Router);
  uiService: UiService = inject(UiService);

  isAuthenticated = signal(this.supabase.isAuthenticated());

  constructor() {
    // This effect will react to router events to update authentication status.
    // This is useful if auth state changes can be triggered by navigation or guards.
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.isAuthenticated.set(this.supabase.isAuthenticated());
    });
  }
}
