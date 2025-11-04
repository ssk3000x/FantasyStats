import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  // FIX: Add explicit types to injected services
  private supabase: SupabaseService = inject(SupabaseService);
  private router: Router = inject(Router);

  teamName = signal('');
  password = signal('');
  isLoading = signal(false);
  error = signal<string | null>(null);

  updateTeamName(event: Event) {
    const input = event.target as HTMLInputElement;
    this.teamName.set(input.value);
  }

  updatePassword(event: Event) {
    const input = event.target as HTMLInputElement;
    this.password.set(input.value);
  }

  async login() {
    if (!this.teamName() || !this.password()) {
      this.error.set('Please enter a team name and password.');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    const { user, error } = await this.supabase.login(this.teamName(), this.password());

    this.isLoading.set(false);
    if (error) {
      this.error.set(error);
    } else if (user) {
      this.router.navigate(['/my-team']);
    }
  }
}