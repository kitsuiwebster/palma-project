import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { PhotosCreditsComponent } from '../photos-credits/photos-credits.component';

// Définir un type pour les clés de expandedGroups
type GroupKey = 'taxonomy' | 'geography' | 'growth' | 'leaves' | 'fruits';

@Component({
  selector: 'app-palm-data',
  standalone: true,
  imports: [CommonModule, HttpClientModule, PhotosCreditsComponent],
  templateUrl: './palm-data.component.html',
  styleUrl: './palm-data.component.scss'
})
export class PalmDataComponent {
  activeTab: 'overview' | 'dataset' | 'methodology' | 'references' | 'photos' = 'overview';
  expandedGroups: Record<GroupKey, boolean> = {
    taxonomy: false,
    geography: false,
    growth: false,
    leaves: false,
    fruits: false
  };
  
  toggleGroup(group: GroupKey, event: Event): void {
    event.stopPropagation();
    this.expandedGroups[group] = !this.expandedGroups[group];
  }
  
  switchTab(tab: 'overview' | 'dataset' | 'methodology' | 'references' | 'photos'): void {
    this.activeTab = tab;
  }
}