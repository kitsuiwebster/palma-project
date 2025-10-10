import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { SearchService } from '../../core/services/search.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Observable, combineLatest, of } from 'rxjs';
import { map, debounceTime, tap, shareReplay, switchMap, startWith, distinctUntilChanged } from 'rxjs/operators';
import { DataService } from '../../core/services/data.service';
import { PalmTrait } from '../../core/models/palm-trait.model';
import { PalmCardComponent } from '../../shared/components/palm-card/palm-card.component';
import { CommonModule } from '@angular/common';
import { RegionCodesService } from '../../core/services/region-codes.service';

@Component({
  selector: 'app-palm-search',
  templateUrl: './palm-search.component.html',
  styleUrls: ['./palm-search.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    PalmCardComponent,
    RouterModule,
    ReactiveFormsModule
  ],
})
export class PalmSearchComponent implements OnInit {
  searchDone = false;
  allPalms: PalmTrait[] = [];
  currentSearchResults: PalmTrait[] = []; // Store current search base results
  searchResults$: Observable<PalmTrait[]> = of([]);
  paginatedResults$: Observable<PalmTrait[]> = of([]);
  loading = true;
  searchForm: FormGroup;
  searchQuery = '';
  totalResults = 0;
  
  // Pagination properties
  currentPage = 0;
  pageSize = 20;
  pageSizeOptions = [20, 50, 100];
  
  // All filter options (master lists)
  allGenera: string[] = [];
  allHabitats: string[] = [];
  allPalmTribes: string[] = [];
  allPalmSubfamilies: string[] = [];
  allFruitSizes: string[] = [];
  allConspicuousness: string[] = [];
  allRegions: Array<{code: string, name: string}> = [];
  allStemTypes = [
    { value: 'Climbing', displayName: 'Climbing' },
    { value: 'Acaulescent', displayName: 'Acaulescent' },
    { value: 'Erect', displayName: 'Erect' }
  ];
  allStemProperties = [
    { value: 'StemSolitary', displayName: 'Solitary Stem' },
    { value: 'StemArmed', displayName: 'Armed Stem' },
    { value: 'LeavesArmed', displayName: 'Armed Leaves' }
  ];

  // Currently available options (filtered based on current selections)
  availableGenera: string[] = [];
  availableHabitats: string[] = [];
  availablePalmTribes: string[] = [];
  availablePalmSubfamilies: string[] = [];
  availableFruitSizes: string[] = [];
  availableConspicuousness: string[] = [];
  availableRegions: Array<{code: string, name: string}> = [];
  availableStemTypes = [...this.allStemTypes];
  availableStemProperties = [...this.allStemProperties];
  
  // Cache for filter options to avoid recomputing
  private filterOptionsCache: any = null;
  

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dataService: DataService,
    private fb: FormBuilder,
    private searchService: SearchService,
    private regionCodesService: RegionCodesService,
    private cdr: ChangeDetectorRef
  ) {
    this.searchForm = this.fb.group({
      query: [''],
      genus: [''],
      tribe: [''],
      subfamily: [''],
      heightMin: [null],
      heightMax: [null],
      stemType: [''],
      stemProperty: [''],
      understoreyCanopy: [''],
      fruitSize: [''],
      conspicuousness: [''],
      nativeRegion: ['']
    });

    this.searchResults$ = of([]);
    this.searchDone = false;
  }

  ngOnInit(): void {
    // First load all palms to populate filter options
    this.dataService.getAllPalms().pipe(
      tap(palms => {
        this.allPalms = palms;
        
        // Initialize filter options with caching
        this.initializeFilterOptions();
        
        // Setup intelligent filtering after data is loaded
        this.setupIntelligentFilters();
        
        this.loading = false;
      })
    ).subscribe();

    // Initialize form values from URL query parameters
    this.route.queryParamMap.pipe(
      tap(params => {
        // Get search query from URL
        const query = params.get('q') || '';
        this.searchQuery = query;
        
        // Get pagination params from URL
        this.currentPage = Number(params.get('page')) || 0;
        this.pageSize = Number(params.get('pageSize')) || 20;
        
        // Set initial form values from URL parameters
        this.searchForm.patchValue({
          query: query,
          genus: params.get('genus') || '',
          tribe: params.get('tribe') || '',
          subfamily: params.get('subfamily') || '',
          stemType: params.get('stemType') || '',
          stemProperty: params.get('stemProperty') || '',
          understoreyCanopy: params.get('understoreyCanopy') || '',
          fruitSize: params.get('fruitSize') || '',
          conspicuousness: params.get('conspicuousness') || '',
          nativeRegion: params.get('nativeRegion') || '',
          heightMin: params.get('heightMin') ? Number(params.get('heightMin')) : null,
          heightMax: params.get('heightMax') ? Number(params.get('heightMax')) : null,
        }, { emitEvent: false });
        
        // No automatic search - user must click Search button
      })
    ).subscribe();

    // Set up search results subscription - only shows results after explicit search
    this.searchResults$ = of([]);

    // Set up paginated results - combines search results with pagination
    this.paginatedResults$ = this.searchResults$.pipe(
      map(results => this.getPaginatedResults(results))
    );
  }

  private executeSearch(): void {
    this.loading = true;
    
    // If we have a text query, use the search service
    if (this.searchForm.value.query && this.searchForm.value.query.trim() !== '') {
      this.dataService.searchPalms(this.searchForm.value.query, null).pipe(
        tap(results => {
          // Store the base search results
          this.currentSearchResults = results;
          // After getting text search results, apply other filters
          const filteredResults = this.filterPalms(results, this.searchForm.value);
          this.totalResults = filteredResults.length;
          // Reset to first page for new search
          this.currentPage = 0;
          this.searchService.updateSearchResults(filteredResults);
          this.loading = false;
          // Update search results observable directly
          this.searchResults$ = of(filteredResults);
          this.paginatedResults$ = this.searchResults$.pipe(
            map(results => this.getPaginatedResults(results))
          );
        })
      ).subscribe();
    } else {
      // If no text query, use entire dataset as base
      this.currentSearchResults = this.allPalms;
      const filteredResults = this.filterPalms(this.allPalms, this.searchForm.value);
      this.totalResults = filteredResults.length;
      // Reset to first page for new search
      this.currentPage = 0;
      this.searchService.updateSearchResults(filteredResults);
      this.loading = false;
      // Update search results observable directly
      this.searchResults$ = of(filteredResults);
      this.paginatedResults$ = this.searchResults$.pipe(
        map(results => this.getPaginatedResults(results))
      );
    }
  }


  private filterPalms(palms: PalmTrait[], formValues: any): PalmTrait[] {
    const genus = formValues.genus || '';
    const tribe = formValues.tribe || '';
    const subfamily = formValues.subfamily || '';
    const stemType = formValues.stemType || '';
    const stemProperty = formValues.stemProperty || '';
    const understoreyCanopy = formValues.understoreyCanopy || '';
    const fruitSize = formValues.fruitSize || '';
    const conspicuousness = formValues.conspicuousness || '';
    const nativeRegion = formValues.nativeRegion || '';
    const heightMin = formValues.heightMin !== null ? Number(formValues.heightMin) : null;
    const heightMax = formValues.heightMax !== null ? Number(formValues.heightMax) : null;

    let results = [...palms]; // Create a copy to avoid modifying the original

    // Don't filter by query text here - that's handled by the searchPalms service call

    if (genus) {
      results = results.filter((palm: PalmTrait) => (palm.accGenus || palm.genus) === genus);
    }

    if (tribe) {
      results = results.filter((palm: PalmTrait) => (palm.PalmTribe || palm.tribe) === tribe);
    }

    if (subfamily) {
      results = results.filter((palm: PalmTrait) => palm.PalmSubfamily === subfamily);
    }

    if (stemType) {
      if (stemType === 'Climbing') {
        results = results.filter((palm: PalmTrait) => palm.Climbing === 1);
      } else if (stemType === 'Acaulescent') {
        results = results.filter((palm: PalmTrait) => palm.Acaulescent === 1);
      } else if (stemType === 'Erect') {
        results = results.filter((palm: PalmTrait) => palm.Erect === 1);
      }
    }

    if (stemProperty) {
      if (stemProperty === 'StemSolitary') {
        results = results.filter((palm: PalmTrait) => palm.StemSolitary === 1);
      } else if (stemProperty === 'StemArmed') {
        results = results.filter((palm: PalmTrait) => palm.StemArmed === 1);
      } else if (stemProperty === 'LeavesArmed') {
        results = results.filter((palm: PalmTrait) => palm.LeavesArmed === 1);
      }
    }

    if (understoreyCanopy) {
      results = results.filter((palm: PalmTrait) => palm.UnderstoreyCanopy === understoreyCanopy);
    }

    if (fruitSize) {
      results = results.filter((palm: PalmTrait) => palm.FruitSizeCategorical === fruitSize);
    }

    if (conspicuousness) {
      results = results.filter((palm: PalmTrait) => palm.Conspicuousness === conspicuousness);
    }

    if (nativeRegion) {
      results = results.filter((palm: PalmTrait) => {
        const palmNativeRegion = palm.NativeRegion || '';
        // Check if the selected region code is present in the palm's native regions
        return new RegExp(`\\b${nativeRegion}\\b`).test(palmNativeRegion);
      });
    }

    if (heightMin !== null) {
      results = results.filter((palm: PalmTrait) => {
        const height = palm.MaxStemHeight_m || palm.height_max_m || 0;
        return height !== null && height >= heightMin;
      });
    }

    if (heightMax !== null) {
      results = results.filter((palm: PalmTrait) => {
        const height = palm.MaxStemHeight_m || palm.height_max_m || 0;
        return height !== null && height <= heightMax;
      });
    }

    return results;
  }

  // TrackBy function for regions dropdown
  trackByRegionCode(index: number, region: {code: string, name: string}): string {
    return region.code;
  }

  onSearch(): void {
    const formValues = this.searchForm.value;
    const queryParams: any = {
      page: 0, // Reset to first page when searching
      pageSize: this.pageSize
    };

    // Add non-empty form values to query params
    if (formValues.query) queryParams.q = formValues.query;
    if (formValues.genus) queryParams.genus = formValues.genus;
    if (formValues.tribe) queryParams.tribe = formValues.tribe;
    if (formValues.subfamily) queryParams.subfamily = formValues.subfamily;
    if (formValues.stemType) queryParams.stemType = formValues.stemType;
    if (formValues.stemProperty) queryParams.stemProperty = formValues.stemProperty;
    if (formValues.understoreyCanopy) queryParams.understoreyCanopy = formValues.understoreyCanopy;
    if (formValues.fruitSize) queryParams.fruitSize = formValues.fruitSize;
    if (formValues.conspicuousness) queryParams.conspicuousness = formValues.conspicuousness;
    if (formValues.nativeRegion) queryParams.nativeRegion = formValues.nativeRegion;
    if (formValues.heightMin) queryParams.heightMin = formValues.heightMin;
    if (formValues.heightMax) queryParams.heightMax = formValues.heightMax;

    // Reset to first page
    this.currentPage = 0;
    
    // Navigate with query params
    this.router.navigate(['/palms/search'], { queryParams });

    // Mark search as done and execute search
    this.searchDone = true;
    this.executeSearch();
    
    // Scroll to results after a delay to ensure DOM is updated
    setTimeout(() => {
      const resultsElement = document.getElementById('search-results-anchor');
      
      if (resultsElement) {
        resultsElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 1000);
  }

  clearFilters(): void {
    this.searchForm.patchValue({
      genus: '',
      tribe: '',
      subfamily: '',
      stemType: '',
      stemProperty: '',
      understoreyCanopy: '',
      fruitSize: '',
      conspicuousness: '',
      heightMin: null,
      heightMax: null,
    });

    // Keep only the search query and pagination
    this.router.navigate(['/palms/search'], {
      queryParams: {
        q: this.searchForm.value.query,
        page: this.currentPage,
        pageSize: this.pageSize
      },
    });
    
    // Re-execute search if a search has been done
    if (this.searchDone) {
      this.executeSearch();
    }
  }

  onPageSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.pageSize = Number(select.value);
    this.goToPage(0); // Reset to first page
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.getTotalPages() || page === this.currentPage) {
      return;
    }

    this.currentPage = page;

    // Update route with new pagination
    const queryParams: Record<string, any> = { ...this.route.snapshot.queryParams };
    queryParams['page'] = this.currentPage;
    queryParams['pageSize'] = this.pageSize;

    this.router.navigate(['/palms/search'], { queryParams });

    // Update pagination display
    this.paginatedResults$ = this.searchResults$.pipe(
      map(results => this.getPaginatedResults(results))
    );
  }

  getTotalPages(): number {
    return Math.ceil(this.totalResults / this.pageSize);
  }

  getPageRange(): number[] {
    const totalPages = this.getTotalPages();

    if (totalPages <= 7) {
      // If less than 7 pages, show all
      return Array.from({ length: totalPages }, (_, i) => i);
    }

    // Always include first, last, current, and pages adjacent to current
    const pages: number[] = [];

    // Add first page
    pages.push(0);

    if (this.currentPage > 1) {
      // Add ellipsis if there's a gap
      if (this.currentPage > 2) {
        pages.push(-1); // -1 represents ellipsis
      }
      // Add page before current
      pages.push(this.currentPage - 1);
    }

    // Add current page if not first or last
    if (this.currentPage > 0 && this.currentPage < totalPages - 1) {
      pages.push(this.currentPage);
    }

    if (this.currentPage < totalPages - 2) {
      // Add page after current
      pages.push(this.currentPage + 1);

      // Add ellipsis if there's a gap
      if (this.currentPage < totalPages - 3) {
        pages.push(-1); // -1 represents ellipsis
      }
    }

    // Add last page if not already included
    if (totalPages > 1) {
      pages.push(totalPages - 1);
    }

    return pages;
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }

  // Get paginated subset of results
  private getPaginatedResults(allResults: PalmTrait[]): PalmTrait[] {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return allResults.slice(startIndex, endIndex);
  }


  // Track last form values to detect actual filter changes
  private lastFormValues: any = {};

  // Check if filters have actually changed (not just pagination)
  private hasFiltersChanged(currentValues: any): boolean {
    const filterKeys = ['query', 'genus', 'tribe', 'subfamily', 'stemType', 'stemProperty', 
                      'understoreyCanopy', 'fruitSize', 'conspicuousness', 'heightMin', 'heightMax'];
    
    const hasChanged = filterKeys.some(key => 
      this.lastFormValues[key] !== currentValues[key]
    );
    
    if (hasChanged) {
      this.lastFormValues = { ...currentValues };
    }
    
    return hasChanged;
  }

  // Initialize filter options with caching for better performance
  private initializeFilterOptions(): void {
    // Use cache if available
    if (this.filterOptionsCache) {
      this.allGenera = this.filterOptionsCache.allGenera;
      this.allPalmTribes = this.filterOptionsCache.allPalmTribes;
      this.allPalmSubfamilies = this.filterOptionsCache.allPalmSubfamilies;
      this.allHabitats = this.filterOptionsCache.allHabitats;
      this.allFruitSizes = this.filterOptionsCache.allFruitSizes;
      this.allConspicuousness = this.filterOptionsCache.allConspicuousness;
      this.allRegions = this.filterOptionsCache.allRegions;
    } else {
      // Extract all unique options from data
      this.allGenera = [...new Set(this.allPalms.map(palm => palm.accGenus || palm.genus).filter(Boolean) as string[])].sort();
      this.allPalmTribes = [...new Set(this.allPalms.map(palm => palm.PalmTribe || palm.tribe).filter(Boolean) as string[])].sort();
      this.allPalmSubfamilies = [...new Set(this.allPalms.map(palm => palm.PalmSubfamily).filter(Boolean))].sort();
      this.allHabitats = [...new Set(this.allPalms.map(palm => palm.UnderstoreyCanopy).filter(Boolean))].sort();
      this.allFruitSizes = [...new Set(this.allPalms.map(palm => palm.FruitSizeCategorical).filter(Boolean))].sort();
      this.allConspicuousness = [...new Set(this.allPalms.map(palm => palm.Conspicuousness).filter(Boolean))].sort();
      
      // Extract all unique region codes from native regions
      this.initializeRegionsSync();
      
      // Cache the results
      this.filterOptionsCache = {
        allGenera: this.allGenera,
        allPalmTribes: this.allPalmTribes,
        allPalmSubfamilies: this.allPalmSubfamilies,
        allHabitats: this.allHabitats,
        allFruitSizes: this.allFruitSizes,
        allConspicuousness: this.allConspicuousness,
        allRegions: this.allRegions
      };
    }

    // Initialize available options to all options (no filtering yet)
    this.resetAvailableOptions();
  }

  // Initialize regions from region codes service (sync version)
  private initializeRegionsSync(): void {
    // Get all unique region codes from native regions
    const allRegionCodes = new Set<string>();
    
    this.allPalms.forEach(palm => {
      const nativeRegion = palm.NativeRegion || '';
      // Extract region codes (2-3 letter codes)
      const codes = nativeRegion.match(/\b[A-Z]{2,3}\b/g) || [];
      codes.forEach(code => allRegionCodes.add(code));
    });

    // Initialize with region codes first, names will be loaded later
    this.allRegions = Array.from(allRegionCodes)
      .map(code => ({ code, name: code })) // Temporary: use code as name
      .sort((a, b) => a.code.localeCompare(b.code));
    
    // Load region names asynchronously
    this.loadRegionNames();
  }

  // Load region names asynchronously and update the display
  private async loadRegionNames(): Promise<void> {
    const regions: Array<{code: string, name: string}> = [];
    
    for (const region of this.allRegions) {
      try {
        if (await this.regionCodesService.hasRegionCode(region.code)) {
          const name = await this.regionCodesService.getRegionName(region.code);
          regions.push({ code: region.code, name });
        } else {
          regions.push({ code: region.code, name: `Unknown region (${region.code})` });
        }
      } catch (error) {
        console.warn(`Error loading name for region ${region.code}:`, error);
        regions.push({ code: region.code, name: `Unknown region (${region.code})` });
      }
    }
    
    this.allRegions = regions.sort((a, b) => a.name.localeCompare(b.name));
    this.availableRegions = [...this.allRegions];
    
    // Update cache if it exists
    if (this.filterOptionsCache) {
      this.filterOptionsCache.allRegions = this.allRegions;
    }
    
    // Trigger change detection to update the UI
    this.cdr.detectChanges();
  }

  // Reset all available options to full lists (no filtering)
  private resetAvailableOptions(): void {
    this.availableGenera = [...this.allGenera];
    this.availablePalmTribes = [...this.allPalmTribes];
    this.availablePalmSubfamilies = [...this.allPalmSubfamilies];
    this.availableHabitats = [...this.allHabitats];
    this.availableFruitSizes = [...this.allFruitSizes];
    this.availableConspicuousness = [...this.allConspicuousness];
    this.availableRegions = [...this.allRegions];
    this.availableStemTypes = [...this.allStemTypes];
    this.availableStemProperties = [...this.allStemProperties];
  }

  // Get filtered palms based on current form selections
  private getFilteredPalmsForOptions(): PalmTrait[] {
    const formValues = this.searchForm.value;
    let filteredPalms = [...this.allPalms];

    // Apply all current filters to get the subset of palms
    if (formValues.genus) {
      filteredPalms = filteredPalms.filter(palm => (palm.accGenus || palm.genus) === formValues.genus);
    }
    if (formValues.tribe) {
      filteredPalms = filteredPalms.filter(palm => (palm.PalmTribe || palm.tribe) === formValues.tribe);
    }
    if (formValues.subfamily) {
      filteredPalms = filteredPalms.filter(palm => palm.PalmSubfamily === formValues.subfamily);
    }
    if (formValues.stemType) {
      if (formValues.stemType === 'Climbing') {
        filteredPalms = filteredPalms.filter(palm => palm.Climbing === 1);
      } else if (formValues.stemType === 'Acaulescent') {
        filteredPalms = filteredPalms.filter(palm => palm.Acaulescent === 1);
      } else if (formValues.stemType === 'Erect') {
        filteredPalms = filteredPalms.filter(palm => palm.Erect === 1);
      }
    }
    if (formValues.stemProperty) {
      filteredPalms = filteredPalms.filter(palm => palm[formValues.stemProperty as keyof PalmTrait] === 1);
    }
    if (formValues.understoreyCanopy) {
      filteredPalms = filteredPalms.filter(palm => palm.UnderstoreyCanopy === formValues.understoreyCanopy);
    }
    if (formValues.fruitSize) {
      filteredPalms = filteredPalms.filter(palm => palm.FruitSizeCategorical === formValues.fruitSize);
    }
    if (formValues.conspicuousness) {
      filteredPalms = filteredPalms.filter(palm => palm.Conspicuousness === formValues.conspicuousness);
    }

    return filteredPalms;
  }

  // Update all available options based on current selections
  private updateAllAvailableOptions(): void {
    const filteredPalms = this.getFilteredPalmsForOptions();
    const formValues = this.searchForm.value;

    // Extract available options from filtered palms (excluding the field being filtered)
    if (!formValues.genus) {
      this.availableGenera = [...new Set(filteredPalms.map(palm => palm.accGenus || palm.genus).filter(Boolean) as string[])].sort();
    }
    if (!formValues.tribe) {
      this.availablePalmTribes = [...new Set(filteredPalms.map(palm => palm.PalmTribe || palm.tribe).filter(Boolean) as string[])].sort();
    }
    if (!formValues.subfamily) {
      this.availablePalmSubfamilies = [...new Set(filteredPalms.map(palm => palm.PalmSubfamily).filter(Boolean) as string[])].sort();
    }
    if (!formValues.understoreyCanopy) {
      this.availableHabitats = [...new Set(filteredPalms.map(palm => palm.UnderstoreyCanopy).filter(Boolean) as string[])].sort();
    }
    if (!formValues.fruitSize) {
      this.availableFruitSizes = [...new Set(filteredPalms.map(palm => palm.FruitSizeCategorical).filter(Boolean) as string[])].sort();
    }
    if (!formValues.conspicuousness) {
      this.availableConspicuousness = [...new Set(filteredPalms.map(palm => palm.Conspicuousness).filter(Boolean) as string[])].sort();
    }

    // Update stem types based on filtered palms
    if (!formValues.stemType) {
      const availableStemTypeValues: string[] = [];
      if (filteredPalms.some(palm => palm.Climbing === 1)) availableStemTypeValues.push('Climbing');
      if (filteredPalms.some(palm => palm.Acaulescent === 1)) availableStemTypeValues.push('Acaulescent');
      if (filteredPalms.some(palm => palm.Erect === 1)) availableStemTypeValues.push('Erect');
      this.availableStemTypes = this.allStemTypes.filter(type => availableStemTypeValues.includes(type.value));
    }

    // Update stem properties based on filtered palms
    if (!formValues.stemProperty) {
      const availableStemPropertyValues: string[] = [];
      if (filteredPalms.some(palm => palm.StemSolitary === 1)) availableStemPropertyValues.push('StemSolitary');
      if (filteredPalms.some(palm => palm.StemArmed === 1)) availableStemPropertyValues.push('StemArmed');
      if (filteredPalms.some(palm => palm.LeavesArmed === 1)) availableStemPropertyValues.push('LeavesArmed');
      this.availableStemProperties = this.allStemProperties.filter(prop => availableStemPropertyValues.includes(prop.value));
    }

    // Clear selections that are no longer available
    this.clearUnavailableSelections();
  }

  // Clear form selections that are no longer available in filtered options
  private clearUnavailableSelections(): void {
    const formValues = this.searchForm.value;
    const updates: any = {};

    if (formValues.genus && !this.availableGenera.includes(formValues.genus)) {
      updates.genus = '';
    }
    if (formValues.tribe && !this.availablePalmTribes.includes(formValues.tribe)) {
      updates.tribe = '';
    }
    if (formValues.subfamily && !this.availablePalmSubfamilies.includes(formValues.subfamily)) {
      updates.subfamily = '';
    }
    if (formValues.stemType && !this.availableStemTypes.some(type => type.value === formValues.stemType)) {
      updates.stemType = '';
    }
    if (formValues.stemProperty && !this.availableStemProperties.some(prop => prop.value === formValues.stemProperty)) {
      updates.stemProperty = '';
    }
    if (formValues.understoreyCanopy && !this.availableHabitats.includes(formValues.understoreyCanopy)) {
      updates.understoreyCanopy = '';
    }
    if (formValues.fruitSize && !this.availableFruitSizes.includes(formValues.fruitSize)) {
      updates.fruitSize = '';
    }
    if (formValues.conspicuousness && !this.availableConspicuousness.includes(formValues.conspicuousness)) {
      updates.conspicuousness = '';
    }

    if (Object.keys(updates).length > 0) {
      this.searchForm.patchValue(updates, { emitEvent: false });
    }
  }

  // Setup form value change listeners for intelligent filtering
  private setupIntelligentFilters(): void {
    // Listen to any form changes to update available options
    this.searchForm.valueChanges.subscribe(() => {
      this.updateAllAvailableOptions();
    });
  }
}