import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PalmMapComponent } from '../../core/components/palm-map/palm-map.component';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule, PalmMapComponent],
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss']
})
export class OverviewComponent {
}