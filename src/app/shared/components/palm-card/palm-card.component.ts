// src/app/shared/components/palm-card/palm-card.component.ts
import { Component, Input, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { FlagService } from '../../../core/services/flag.service';
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
  
  constructor(private cdr: ChangeDetectorRef, private flagService: FlagService) {}
  
  
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
    return this.palm?.native_region || 'Unknown region';
  }

  flagUrls: {[region: string]: string} = {};

  getNativeRegions(): string[] {
    if (!this.palm?.native_region) return [];
    // Remove parentheses content
    let native = this.palm.native_region.replace(/\([^)]*\)/g, '').trim();
    let result: string[] = [];
    // If " to " is present, split into left and right parts
    if (native.toLowerCase().includes(" to ")) {
      // Left: before last " to " ; Right: after last " to "
      const idx = native.toLowerCase().lastIndexOf(" to ");
      const left = native.substring(0, idx).trim();
      const right = native.substring(idx + 4).trim();
      // For left, take the last token if separated by comma or semicolon
      const leftTokens = left.split(/[,;]+/).map(p => p.trim()).filter(p => p);
      if(leftTokens.length) {
        result.push(leftTokens[leftTokens.length - 1]);
      }
      // For right, split by "and" or "&"
      let parts = right.split(/\s+(?:and|&)\s+/i).map(p => p.trim()).filter(p => p);
      parts.forEach(part => {
        // If the part contains "&", choose the longer segment
        if (part.includes("&")) {
          const subParts = part.split(/\s*&\s*/).map(s => s.trim()).filter(s => s);
          subParts.sort((a, b) => b.length - a.length);
          result.push(subParts[0]);
        } else {
          result.push(part);
        }
      });
    } else {
      // If no "to" exists, split by commas, semicolons, "and", or "&"
      result = native.split(/\s*(?:,|;|and|&)\s*/i).map(p => p.trim()).filter(p => p);
    }
    return result;
  }

  fetchFlag(region: string): void {
    if (this.flagUrls[region]) return;
    this.flagService.getFlagUrl(region).subscribe(url => {
      this.flagUrls[region] = url;
    });
  }

  getFlagUrl(region: string): string | null {
    return this.flagUrls[region] || null;
  }

  fetchAllFlags(): void {
    this.getNativeRegions().forEach(region => this.fetchFlag(region));
  }

  ngOnInit() {
    setTimeout(() => {
      this.shouldShowAnimation = true;
      this.cdr.detectChanges();
    }, Math.random() * 100);
    this.fetchAllFlags();
  }
}