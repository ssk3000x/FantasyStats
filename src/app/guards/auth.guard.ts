import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const authGuard: CanActivateFn = () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  if (supabase.isAuthenticated()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

export const loginGuard: CanActivateFn = () => {
    const supabase = inject(SupabaseService);
    const router = inject(Router);

    if (supabase.isAuthenticated()) {
        router.navigate(['/my-team']);
        return false;
    }

    return true;
}
