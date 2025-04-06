// src/app/shared/components/palm-card/palm-card.component.ts
import { Component, Input, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
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
    SlugifyPipe,
    RouterLink,
  ],
})
export class PalmCardComponent implements OnInit, AfterViewInit {
  @Input() palm!: PalmTrait;
  // Valeurs par défaut
  defaultImagePath = 'assets/images/no-image.png';
  
  // Variable pour contrôler l'animation une seule fois
  shouldShowAnimation = false;
  
  constructor(private cdr: ChangeDetectorRef) {}
  
  ngOnInit() {
    // Initialiser l'animation à true seulement au premier rendu
    this.shouldShowAnimation = !PalmCardComponent.initialRenderComplete;
  }
  
  ngAfterViewInit() {
    // Marquer le rendu initial comme terminé après le premier cycle de rendu
    PalmCardComponent.initialRenderComplete = true;
  }
  
  // Variable statique pour suivre si le rendu initial est terminé
  private static initialRenderComplete = false;
  
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
  getNativeRegion(): string {
    return this.palm?.native_region || 'Unknown region';
  }
}