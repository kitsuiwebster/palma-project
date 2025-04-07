import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-palm-data',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './palm-data.component.html',
  styleUrl: './palm-data.component.scss'
})
export class PalmDataComponent {
  activeTab: 'overview' | 'dataset' | 'methodology' | 'references' = 'overview';

  switchTab(tab: 'overview' | 'dataset' | 'methodology' | 'references'): void {
    this.activeTab = tab;
  }
}