// src/app/features/palms/pages/palm-detail/palm-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Observable, of, switchMap, catchError } from 'rxjs';
import { DataService } from '../../core/services/data.service';
import { Title, Meta } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { PalmTrait } from '../../core/models/palm-trait.model';
import { FlagService } from '../../core/services/flag.service';
import { RegionWithFlagsPipe } from '../../shared/pipes/region-with-flags.pipe';
import { FormatCommonNamesPipe } from '../../shared/pipes/format-common-names.pipe';
import { ImageLightboxComponent } from '../../shared/components/image-lightbox/image-lightbox.component';

@Component({
  selector: 'app-palm-detail',
  templateUrl: './palm-detail.component.html',
  styleUrls: ['./palm-detail.component.scss'],
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    FormatCommonNamesPipe,
    ImageLightboxComponent,
  ],
})
export class PalmDetailComponent implements OnInit {
  referencesMap: Record<string, string> = {};
  palm$: Observable<PalmTrait | null>;
  palm: PalmTrait | null = null;
  loading = true;
  error = false;
  notFound = false;
  activeTab = 0;

  // Lightbox properties
  showLightbox = false;
  currentImageUrl = '';
  currentSpeciesName = '';
  allImageUrls: string[] = [];
  currentImageIndex = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dataService: DataService,
    private titleService: Title,
    private metaService: Meta,
    private flagService: FlagService,
    private http: HttpClient
  ) {
    this.palm$ = of(null);
  }

  ngOnInit(): void {
    // Load references.txt
    this.http.get('/assets/data/references.txt', { responseType: 'text' }).subscribe(data => {
      const lines = data.split('\n').slice(1); // skip header
      lines.forEach(line => {
        const [specName, refs] = line.split('\t');
        if (specName && refs) {
          this.referencesMap[specName.trim()] = refs.trim().replace(/^"|"$/g, '');
        }
      });
    });

    // Récupérer les paramètres de l'URL une seule fois au chargement
    this.route.paramMap.pipe(
      switchMap((params) => {
        const speciesSlug = params.get('species') || '';
        this.loading = true;
        this.error = false;
        this.notFound = false;
        
        return this.dataService.getPalmBySlug(speciesSlug).pipe(
          catchError((error) => {
            console.error('Error fetching palm details:', error);
            this.loading = false;
            this.error = true;
            return of(null);
          })
        );
      }),
    ).subscribe((palm) => {
      this.loading = false;
      this.palm = palm;
      this.updateFlagsForPalm();
      
      if (!palm) {
        this.notFound = true;
        this.titleService.setTitle('Palm Not Found - Palm Encyclopedia');
        return;
      }

      // Set page title and meta for SEO
      const speciesName = palm.SpecName || palm.species || 'Unknown Species';
      const genus = palm.accGenus || palm.genus || 'Unknown Genus';
      const distribution = palm.distribution || 'various regions';

      this.titleService.setTitle(`${speciesName} - Palm Encyclopedia`);
      this.metaService.updateTag({
        name: 'description',
        content: `Learn about ${speciesName}, a palm species from the ${genus} genus native to ${distribution}.`,
      });
    });
  }
  setActiveTab(index: number): void {
    this.activeTab = index;
  }

  // Méthodes utilitaires pour accéder aux propriétés du palmier de manière sécurisée
  getSpeciesName(palm: PalmTrait): string {
    return palm?.SpecName || palm?.species || 'Unknown Species';
  }

  getGenus(palm: PalmTrait): string {
    return palm?.accGenus || palm?.genus || 'Unknown Genus';
  }

  getTribe(palm: PalmTrait): string {
    return palm?.PalmTribe || palm?.tribe || 'Unknown Tribe';
  }

  getSubfamily(palm: PalmTrait): string {
    return palm?.PalmSubfamily || 'Unknown Subfamily';
  }

  getHeight(palm: PalmTrait): string {
    const height = palm?.MaxStemHeight_m || palm?.height_max_m;
    return height ? `${height} m` : 'Unknown';
  }

  getStemDiameter(palm: PalmTrait): string {
    return palm?.MaxStemDia_cm ? `${palm.MaxStemDia_cm} cm` : 'Unknown';
  }

  getHabitat(palm: PalmTrait): string {
    return palm?.UnderstoreyCanopy || palm?.habitat || 'Unknown';
  }

  getStemType(palm: PalmTrait): string[] {
    const types = [];
    if (palm?.Climbing === 1) types.push('Climbing');
    if (palm?.Acaulescent === 1) types.push('Acaulescent');
    if (palm?.Erect === 1) types.push('Erect');
    return types.length > 0 ? types : ['Unknown'];
  }

  getStemProperties(palm: PalmTrait): string[] {
    const properties = [];
    if (palm?.StemSolitary === 1) properties.push('Solitary');
    if (palm?.StemArmed === 1) properties.push('Armed');
    if (palm?.LeavesArmed === 1) properties.push('Armed Leaves');
    return properties;
  }

  getLeafInfo(palm: PalmTrait): string {
    return palm?.MaxLeafNumber 
      ? `Up to ${palm.MaxLeafNumber} leaves`
      : 'Leaf information not available';
  }

  getFruitInfo(palm: PalmTrait): string {
    if (palm?.FruitSizeCategorical) {
      let info = `${palm.FruitSizeCategorical} sized`;
      if (palm.FruitShape) info += `, ${palm.FruitShape}`;
      if (palm.MainFruitColors) info += `, ${palm.MainFruitColors} colored`;
      return info;
    }
    return 'Fruit information not available';
  }

  // Déterminer si ce palmier a des caractéristiques particulières
  hasFruitData(palm: PalmTrait): boolean {
    return !!palm?.FruitSizeCategorical || !!palm?.FruitShape || !!palm?.MainFruitColors;
  }

  getAllPhotoUrls(palm: PalmTrait): string[] {
    const photosStr = palm?.Photos ?? '';
    if (typeof photosStr !== 'string' || photosStr.trim() === '') {
      return [];
    }
    const lower = photosStr.toLowerCase();
    if (lower.includes('noimages')) {
      return [];
    }
    return photosStr.trim().split(/\s+/).filter((url: string) => url.startsWith('http'));
  }

  hasLeafData(palm: PalmTrait): boolean {
    return !!palm?.MaxLeafNumber || !!palm?.Max_Blade_Length_m || !!palm?.Max_Rachis_Length_m;
  }

  flagUrls: {[region: string]: string} = {};

  getNativeRegions(palm: PalmTrait): string[] {
    if (!palm?.native_region) return [];
    // Remove parentheses content
    let native = palm.native_region.replace(/\([^)]*\)/g, '').trim();
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
    if (this.flagUrls[region]) return; // already fetched
    this.flagService.getFlagUrl(region).subscribe(url => {
      this.flagUrls[region] = url;
    });
  }

  getFlagUrl(region: string): string | null {
    return this.flagUrls[region] || null;
  }

  fetchAllFlags(palm: PalmTrait): void {
    this.getNativeRegions(palm).forEach(region => this.fetchFlag(region));
  }

  // Call this after palm is loaded
  private updateFlagsForPalm(): void {
    if (this.palm) {
      this.fetchAllFlags(this.palm);
    }
  }

  // Modify ngOnInit subscription to call updateFlagsForPalm
  // (this is a patch, not a full replacement)

  // PATCH START
  // inside subscribe((palm) => { ... })
  // after: this.palm = palm;
  // add:
  // this.updateFlagsForPalm();
  // PATCH END
  getReferencesForPalm(): string | null {
    if (!this.palm) return null;
    const name = this.palm.SpecName || this.palm.species;
    if (!name) return null;
    return this.referencesMap[name.trim()] || null;
  }

  // Lightbox methods
  openLightbox(imageUrl: string, speciesName: string) {
    this.currentImageUrl = imageUrl;
    this.currentSpeciesName = speciesName;
    
    // Get all images for this palm and find current index
    if (this.palm) {
      this.allImageUrls = this.getAllPhotoUrls(this.palm);
      this.currentImageIndex = this.allImageUrls.findIndex(url => url === imageUrl);
      if (this.currentImageIndex === -1) {
        this.currentImageIndex = 0;
      }
    }
    
    this.showLightbox = true;
    // Prevent body scroll when lightbox is open
    document.body.style.overflow = 'hidden';
  }

  onImageIndexChange(newIndex: number) {
    this.currentImageIndex = newIndex;
    if (this.allImageUrls[newIndex]) {
      this.currentImageUrl = this.allImageUrls[newIndex];
    }
  }

  closeLightbox() {
    this.showLightbox = false;
    this.currentImageUrl = '';
    this.currentSpeciesName = '';
    // Restore body scroll
    document.body.style.overflow = 'auto';
  }
}