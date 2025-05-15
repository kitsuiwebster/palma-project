import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// Define a type for the expandedGroups keys
type GroupKey = 'taxonomy' | 'geography' | 'growth' | 'leaves' | 'fruits';

@Component({
  selector: 'app-dataset',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dataset.component.html',
  styleUrl: './dataset.component.scss'
})
export class DatasetComponent {
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
}