// src/app/shared/components/palm-card/palm-card.component.ts
import { Component, Input } from '@angular/core';
import { PalmTrait } from '../../../core/services/data.service';
import { CommonModule } from '@angular/common';
import {
  MatCard,
  MatCardHeader,
  MatCardContent,
  MatCardActions,
} from '@angular/material/card';
import { MatCardImage } from '@angular/material/card';
import {
  MatCardTitle,
  MatCardSubtitle,
  MatCardTitleGroup,
} from '@angular/material/card';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { SlugifyPipe } from '../../pipes/slugify.pipe';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-palm-card',
  templateUrl: './palm-card.component.html',
  styleUrls: ['./palm-card.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCard,
    MatCardHeader,
    MatCardContent,
    MatCardActions,
    MatCardImage,
    MatCardTitle,
    MatCardSubtitle,
    MatCardTitleGroup,
    MatButton,
    MatIcon,
    SlugifyPipe,
    RouterLink,
  ],
})
export class PalmCardComponent {
  @Input() palm!: PalmTrait;

  getConservationStatusClass(): string {
    if (!this.palm?.conservation_status) return 'status-unknown';

    const status = this.palm.conservation_status.toLowerCase();
    if (status.includes('endangered') || status.includes('critical')) {
      return 'status-endangered';
    } else if (status.includes('vulnerable')) {
      return 'status-vulnerable';
    } else if (status.includes('concern') || status.includes('safe')) {
      return 'status-safe';
    } else {
      return 'status-unknown';
    }
  }
}
