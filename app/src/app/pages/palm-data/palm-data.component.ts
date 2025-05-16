import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

// Import all the tab components
import { OverviewComponent } from '../overview/overview.component';
import { DatasetComponent } from '../dataset/dataset.component';
import { MethodologyComponent } from '../methodology/methodology.component';
import { ReferencesComponent } from '../references/references.component';
import { PhotosCreditsComponent } from '../photos-credits/photos-credits.component';

@Component({
  selector: 'app-palm-data',
  standalone: true,
  imports: [
    CommonModule, 
    HttpClientModule, 
    OverviewComponent,
    DatasetComponent, 
    MethodologyComponent, 
    ReferencesComponent,
    PhotosCreditsComponent
  ],
  templateUrl: './palm-data.component.html',
  styleUrl: './palm-data.component.scss'
})
export class PalmDataComponent {
  activeTab: 'overview' | 'dataset' | 'methodology' | 'references' | 'photos' = 'overview';
  
  switchTab(tab: 'overview' | 'dataset' | 'methodology' | 'references' | 'photos'): void {
    this.activeTab = tab;
  }
}