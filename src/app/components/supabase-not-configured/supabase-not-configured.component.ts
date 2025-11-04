import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-supabase-not-configured',
  standalone: true,
  template: `
    <div class="fixed inset-0 bg-gray-900 flex items-center justify-center p-4 z-[100]">
      <div class="bg-gray-800 border border-red-500 rounded-lg shadow-2xl p-6 sm:p-8 max-w-2xl w-full text-white">
        <div class="text-center">
          <svg class="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 class="mt-4 text-2xl font-bold">Configuration Required</h2>
          <p class="mt-2 text-gray-400">
            Your Supabase backend is not connected. To use the app, you need to add your project credentials.
          </p>
        </div>
        <div class="mt-6">
          <p class="font-semibold">Follow these steps:</p>
          <ol class="list-decimal list-inside mt-2 space-y-2 text-gray-300">
            <li>Go to your <a href="https://supabase.com/dashboard/projects" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">Supabase Project Dashboard</a>.</li>
            <li>Navigate to <span class="font-mono bg-gray-700 px-1 rounded-sm">Project Settings > API</span>.</li>
            <li>Copy the <span class="font-mono bg-gray-700 px-1 rounded-sm">Project URL</span> and the public <span class="font-mono bg-gray-700 px-1 rounded-sm">anon</span> key.</li>
            <li>Open the following file in your project:</li>
          </ol>
        </div>
        <div class="mt-4 bg-gray-900 p-4 rounded-lg font-mono text-sm text-gray-300 overflow-x-auto">
          <p class="text-yellow-400">// src/app/services/supabase.config.ts</p>
          <p>export const supabaseUrl = <span class="text-red-400">'YOUR_SUPABASE_URL'</span>;</p>
          <p>export const supabaseKey = <span class="text-red-400">'YOUR_SUPABASE_ANON_KEY'</span>;</p>
        </div>
         <p class="mt-4 text-gray-400 text-sm">
            Replace the placeholder strings with your actual credentials. The application will automatically update once the file is saved.
          </p>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupabaseNotConfiguredComponent {}
