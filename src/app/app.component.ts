import { Component, ChangeDetectionStrategy, effect, inject, signal } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavComponent } from './components/layout/nav/nav.component';
import { SupabaseService } from './services/supabase.service';
import { filter } from 'rxjs';
import { PlayerDetailModalComponent } from './components/shared/player-detail-modal/player-detail-modal.component';
import { UiService } from './services/ui.service';
import { SupabaseNotConfiguredComponent } from './components/supabase-not-configured/supabase-not-configured.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavComponent, PlayerDetailModalComponent, SupabaseNotConfiguredComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  supabase: SupabaseService = inject(SupabaseService);
  private router: Router = inject(Router);
  uiService: UiService = inject(UiService);

  isSupabaseConfigured = this.supabase.isConfigured;
  isAuthenticated = signal(this.supabase.isAuthenticated());
  isLoading = signal(true);

  constructor() {
    // Wait for Supabase to load its initial data before hiding the loader
    effect(() => {
        if(this.supabase.dataLoaded()) {
            this.isLoading.set(false);
            this.isAuthenticated.set(this.supabase.isAuthenticated());
        }
    });

    // This effect will react to router events to re-check authentication status.
    // This is useful if auth state changes are triggered by guards after initial load.
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.isAuthenticated.set(this.supabase.isAuthenticated());
    });
  }
}