// src/app/shared/components/palm-card/palm-card.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { PalmTrait } from '../../../core/models/palm-trait.model';
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
export class PalmCardComponent implements OnInit {
  @Input() palm!: PalmTrait;
  
  // Valeurs par défaut
  defaultImagePath = 'assets/images/palm-default.jpg';

  ngOnInit() {
  }

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
  
  // Méthodes pour obtenir des valeurs sécurisées avec des valeurs par défaut
  
  getSpecies(): string {
    return this.palm?.species || this.palm?.SpecName || 'Unknown Species';
  }
  
  getGenus(): string {
    return this.palm?.genus || this.palm?.accGenus || 'Unknown Genus';
  }
  
  getTribe(): string {
    return this.palm?.tribe || this.palm?.PalmTribe || 'Unknown Tribe';
  }
  
  getHeight(): string {
    const height = this.palm?.height_max_m || this.palm?.MaxStemHeight_m;
    return height ? `${height} m` : 'Unknown height';
  }
  
  getDistribution(): string {
    return this.palm?.distribution || 'Unknown distribution';
  }
  
  getHabitat(): string {
    return this.palm?.habitat || (this.palm?.UnderstoreyCanopy || 'Unknown habitat');
  }
  
  getImageUrl(): string {
    if (this.palm?.image_url) {
      return this.palm.image_url;
    }
    
    // Construire un chemin d'image basé sur le nom de l'espèce
    const speciesName = this.palm?.SpecName || this.palm?.species || '';
    if (speciesName) {
      const slug = this.slugify(speciesName);
      return `assets/images/palms/${slug}.jpg`;
    }
    
    return this.defaultImagePath;
  }
  
  private slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }
}