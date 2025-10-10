// src/app/features/palms/pages/palm-detail/palm-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Observable, of, switchMap, catchError, map } from 'rxjs';
import { DataService } from '../../core/services/data.service';
import { Title, Meta } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { PalmTrait } from '../../core/models/palm-trait.model';
import { RegionCodesService } from '../../core/services/region-codes.service';
import { FormatCommonNamesPipe } from '../../shared/pipes/format-common-names.pipe';
import { ImageLightboxComponent } from '../../shared/components/image-lightbox/image-lightbox.component';
import { SpeciesMapComponent } from '../../shared/components/species-map/species-map.component';

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
    SpeciesMapComponent,
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
  private tabFragments = ['characteristics', 'native-range', 'gallery'];
  private previousSpeciesSlug: string | null = null;

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
    private regionCodesService: RegionCodesService,
    private http: HttpClient
  ) {
    this.palm$ = of(null);
  }

  ngOnInit(): void {
    // Disable browser scroll restoration immediately
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    
    // Clear any unwanted fragments from URL that cause auto-scroll
    const currentUrl = this.router.url;
    if (currentUrl.includes('#characteristics') || currentUrl.includes('#gallery') || currentUrl.includes('#native-range')) {
      // Clear URL fragment first
      this.router.navigate([], { fragment: undefined, replaceUrl: true });
    }
    
    // Force scroll to top with comprehensive approach
    const mainContent = document.querySelector('.main-content');
    const appContainer = document.querySelector('.app-container');
    
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if (mainContent) (mainContent as HTMLElement).scrollTop = 0;
    if (appContainer) (appContainer as HTMLElement).scrollTop = 0;
    
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
        const isNewSpecies = this.previousSpeciesSlug !== speciesSlug;
        this.previousSpeciesSlug = speciesSlug;
        
        this.loading = true;
        this.error = false;
        this.notFound = false;
        
        return this.dataService.getPalmBySlug(speciesSlug).pipe(
          catchError((error) => {
            this.loading = false;
            this.error = true;
            return of(null);
          })
        ).pipe(map(palm => ({ palm, isNewSpecies })));
      }),
    ).subscribe(({ palm, isNewSpecies }) => {
      this.loading = false;
      this.palm = palm;
      this.updateFlagsForPalm();
      // Initialize image URLs for fragment navigation
      if (this.palm) {
        this.allImageUrls = this.getAllPhotoUrls(this.palm);
      }
      this.handleFragmentNavigation();
      
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
    // Update URL fragment
    const fragment = this.tabFragments[index];
    this.router.navigate([], { fragment: fragment, replaceUrl: true });
  }

  private handleFragmentNavigation(): void {
    // Handle initial fragment from URL
    this.route.fragment.subscribe(fragment => {
      if (fragment) {
        if (fragment.startsWith('gallery/image-')) {
          // Handle image fragment only if lightbox is not already open
          if (!this.showLightbox) {
            this.activeTab = 2; // Gallery tab
            const imageIndex = parseInt(fragment.replace('gallery/image-', '')) - 1;
            if (imageIndex >= 0 && this.palm) {
              setTimeout(() => this.openImageByIndex(imageIndex), 100);
            }
          }
        } else {
          // Handle tab fragment
          const tabIndex = this.tabFragments.indexOf(fragment);
          if (tabIndex !== -1) {
            this.activeTab = tabIndex;
          }
        }
      } else {
        // Fragment is null/empty - ensure lightbox is closed
        if (this.showLightbox) {
          this.showLightbox = false;
          this.currentImageUrl = '';
          this.currentSpeciesName = '';
          this.currentImageIndex = 0;
          document.body.style.overflow = 'auto';
        }
      }
    });
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

  nativeRegionDisplay: string = '';

  getNativeRegion(): string {
    // Use the new format with region codes
    return this.palm?.NativeRegion || this.palm?.native_region || 'Unknown region';
  }

  async loadNativeRegionDisplay(): Promise<void> {
    const nativeRegion = this.getNativeRegion();
    if (nativeRegion && nativeRegion !== 'Unknown region') {
      // For detail page, show all regions (no limit) as there's more space
      this.nativeRegionDisplay = await this.regionCodesService.convertSubdivisionCodesToDisplay(nativeRegion, true);
    } else {
      this.nativeRegionDisplay = nativeRegion;
    }
  }

  // Call this after palm is loaded
  private updateFlagsForPalm(): void {
    if (this.palm) {
      this.loadNativeRegionDisplay();
    }
  }

  private shouldScrollToTop(): boolean {
    // Check if we have a referrer and if it's from the same site
    const referrer = document.referrer;
    const currentOrigin = window.location.origin;
    
    // Don't scroll if coming from the same site (e.g., search results)
    if (referrer && referrer.startsWith(currentOrigin)) {
      // Don't scroll if coming from search, quiz, or other internal pages
      const referrerPath = referrer.replace(currentOrigin, '');
      if (referrerPath.includes('/search') || 
          referrerPath.includes('/quiz') || 
          referrerPath.includes('/palms/')) {
        return false;
      }
    }
    
    // Scroll to top for external links or direct access
    return true;
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
    // Prevent opening if already open
    if (this.showLightbox) return;
    
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
    // Update URL with image fragment
    const imageFragment = `gallery/image-${this.currentImageIndex + 1}`;
    this.router.navigate([], { fragment: imageFragment, replaceUrl: true });
    
    // Prevent body scroll when lightbox is open
    document.body.style.overflow = 'hidden';
  }

  openImageByIndex(index: number) {
    if (this.palm) {
      // Ensure allImageUrls is populated
      if (this.allImageUrls.length === 0) {
        this.allImageUrls = this.getAllPhotoUrls(this.palm);
      }
      
      if (this.allImageUrls.length > index && index >= 0) {
        const imageUrl = this.allImageUrls[index];
        const speciesName = this.getSpeciesName(this.palm);
        this.openLightbox(imageUrl, speciesName);
      }
    }
  }

  onImageIndexChange(newIndex: number) {
    this.currentImageIndex = newIndex;
    if (this.allImageUrls[newIndex]) {
      this.currentImageUrl = this.allImageUrls[newIndex];
      // Update URL fragment for new image
      const imageFragment = `gallery/image-${newIndex + 1}`;
      this.router.navigate([], { fragment: imageFragment, replaceUrl: true });
    }
  }

  closeLightbox() {
    this.showLightbox = false;
    this.currentImageUrl = '';
    this.currentSpeciesName = '';
    this.currentImageIndex = 0;
    
    // Clear the fragment completely to avoid reopening
    this.router.navigate([], { fragment: undefined, replaceUrl: true }).then(() => {
      // Small delay to ensure navigation is complete
      setTimeout(() => {
        // Only set gallery fragment if we're still on the gallery tab
        if (this.activeTab === 2) {
          this.router.navigate([], { fragment: 'gallery', replaceUrl: true });
        }
      }, 50);
    });
    
    // Restore body scroll
    document.body.style.overflow = 'auto';
  }
}