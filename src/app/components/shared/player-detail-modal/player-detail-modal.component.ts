import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiService } from '../../../services/ui.service';
import { SupabaseService } from '../../../services/supabase.service';

@Component({
  selector: 'app-player-detail-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (player(); as p) {
      <div class="fixed inset-0 bg-black bg-opacity-75 z-40 animate-fade-in" (click)="close()"></div>
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 animate-scale-in">
        <div class="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg relative text-white">
          
          <button (click)="close()" class="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors">
             <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>

          <div class="flex items-center p-6 border-b border-gray-700">
            <div>
              <h2 class="text-2xl font-bold">{{ p.name }}</h2>
              @if(p.ownerTeamName) {
                <p class="text-sm text-gray-400">Owned by <span class="font-semibold">{{ p.ownerTeamName }}</span></p>
              }
            </div>
          </div>
          
          <div class="p-6">
              <div>
                <p class="text-sm text-gray-400">Projected Points (Week {{ currentWeek() }})</p>
                <p class="font-semibold text-lg text-primary">{{ p.projectedScore.toFixed(1) }}</p>
              </div>

              @if(p.weeklyScores && p.weeklyScores.length > 0) {
                <div class="mt-4">
                  <p class="text-sm text-gray-400 mb-2">Weekly Scores</p>
                  <div class="max-h-40 overflow-y-auto pr-2">
                    <table class="w-full text-left">
                      <thead>
                        <tr class="border-b border-gray-600 text-xs text-gray-300">
                          <th class="py-2 font-normal">Week</th>
                          <th class="py-2 font-normal text-right">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for(score of p.weeklyScores; track $index) {
                          <tr class="border-b border-gray-700 last:border-b-0">
                            <td class="py-2">Week {{ $index + 1 }}</td>
                            <td class="py-2 text-right font-semibold">{{ score.toFixed(1) }}</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              }
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes scaleIn {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    
    .animate-fade-in {
        animation: fadeIn 0.15s ease-out forwards;
    }

    .animate-scale-in {
        animation: scaleIn 0.15s ease-out forwards;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerDetailModalComponent {
  private uiService: UiService = inject(UiService);
  private supabase: SupabaseService = inject(SupabaseService);
  player = this.uiService.selectedPlayer;
  currentWeek = computed(() => this.supabase.getCurrentFantasyWeek());

  close() {
    this.uiService.hidePlayerDetails();
  }
}
