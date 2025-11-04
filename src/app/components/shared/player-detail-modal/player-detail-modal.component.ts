import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiService } from '../../../services/ui.service';

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
            <img [src]="p.imageUrl" [alt]="p.name" class="w-20 h-20 rounded-full mr-4 object-cover">
            <div>
              <h2 class="text-2xl font-bold">{{ p.name }}</h2>
              <p class="text-gray-400">{{ p.position }} - {{ p.team }}</p>
            </div>
          </div>
          
          <div class="p-6">
              <div>
                <p class="text-sm text-gray-400">Projected Points</p>
                <p class="font-semibold text-lg text-primary">{{ p.projectedPoints.toFixed(1) }}</p>
              </div>
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
  private uiService = inject(UiService);
  player = this.uiService.selectedPlayer;

  close() {
    this.uiService.hidePlayerDetails();
  }
}
