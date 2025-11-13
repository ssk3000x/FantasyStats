import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabaseUrl } from '../../services/supabase.config';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminComponent {
  serviceKey = signal('');
  userUid = signal('');
  newPassword = signal('');
  
  isLoading = signal(false);
  resultMessage = signal<{ type: 'success' | 'error', text: string } | null>(null);

  async changePassword() {
    if (!this.serviceKey() || !this.userUid() || !this.newPassword()) {
      this.resultMessage.set({ type: 'error', text: 'All fields are required.' });
      return;
    }

    this.isLoading.set(true);
    this.resultMessage.set(null);

    try {
      // Create a temporary Supabase client with admin privileges using the provided service key.
      const adminSupabase = createClient(supabaseUrl, this.serviceKey());
      
      const { data, error } = await adminSupabase.auth.admin.updateUserById(
        this.userUid(),
        { password: this.newPassword() }
      );

      if (error) {
        throw new Error(error.message);
      }

      this.resultMessage.set({ type: 'success', text: `Successfully updated password for user ${data.user.email}.` });
      // Clear fields for security
      this.serviceKey.set('');
      this.userUid.set('');
      this.newPassword.set('');

    } catch (err: any) {
      this.resultMessage.set({ type: 'error', text: `Error: ${err.message || 'An unknown error occurred.'}` });
    } finally {
      this.isLoading.set(false);
    }
  }
}
