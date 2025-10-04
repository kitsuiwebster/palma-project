// src/app/shared/components/palm-card/palm-card.component.ts
import { Component, Input, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { RegionCodesService } from '../../../core/services/region-codes.service';
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
import { RegionWithFlagsPipe } from '../../pipes/region-with-flags.pipe';
import { FormatCommonNamesPipe } from '../../pipes/format-common-names.pipe';

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
    FormatCommonNamesPipe,
  ],
})
export class PalmCardComponent implements OnInit, AfterViewInit {
  imageLoaded = false;
  @Input() palm!: PalmTrait;
  // Valeurs par défaut
  defaultImagePath = 'assets/images/no-image.png';
  
  // Variable pour contrôler l'animation
  shouldShowAnimation = false;
  
  // Utiliser une variable d'instance au lieu d'une variable statique
  private static animationInitialized = false;
  
  constructor(private cdr: ChangeDetectorRef, private regionCodesService: RegionCodesService) {}
  
  
  ngAfterViewInit() {
    // Rien à faire ici, l'animation est gérée par le setTimeout
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
  getNativeRegion(): string {
    // Use the new format with region codes
    return this.palm?.NativeRegion || this.palm?.native_region || 'Unknown region';
  }

  nativeRegionDisplay: string = '';

  async loadNativeRegionDisplay(): Promise<void> {
    const nativeRegion = this.getNativeRegion();
    if (nativeRegion && nativeRegion !== 'Unknown region') {
      this.nativeRegionDisplay = await this.regionCodesService.convertSubdivisionCodesToDisplayLimited(nativeRegion, true, 5);
      this.cdr.detectChanges();
    } else {
      this.nativeRegionDisplay = nativeRegion;
    }
  }

  ngOnInit() {
    setTimeout(() => {
      this.shouldShowAnimation = true;
      this.cdr.detectChanges();
    }, Math.random() * 100);
    this.loadNativeRegionDisplay();
  }
}