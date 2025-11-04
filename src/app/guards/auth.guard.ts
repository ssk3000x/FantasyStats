import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const authGuard: CanActivateFn = () => {
  // FIX: Add explicit types to injected services
  const supabase: SupabaseService = inject(SupabaseService);
  const router: Router = inject(Router);

  if (supabase.isAuthenticated()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

export const loginGuard: CanActivateFn = () => {
    // FIX: Add explicit types to injected services
    const supabase: SupabaseService = inject(SupabaseService);
    const router: Router = inject(Router);

    if (supabase.isAuthenticated()) {
        router.navigate(['/my-team']);
        return false;
    }

    return true;
}