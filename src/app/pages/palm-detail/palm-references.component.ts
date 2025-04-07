import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-palm-references',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './palm-references.component.html',
  styleUrls: ['./palm-references.component.scss']
})
export class PalmReferencesComponent {
  @Input() references: string | null = null;
}