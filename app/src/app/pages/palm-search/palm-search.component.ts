import { Component, OnInit } from '@angular/core';
import { SearchService } from '../../core/services/search.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Observable, combineLatest, of } from 'rxjs';
import { map, debounceTime, tap, shareReplay, switchMap, startWith, distinctUntilChanged } from 'rxjs/operators';
import { DataService } from '../../core/services/data.service';
import { PalmTrait } from '../../core/models/palm-trait.model';
import { PalmCardComponent } from '../../shared/components/palm-card/palm-card.component';
import { CommonModule } from '@angular/common';

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
  availableStemTypes = [...this.allStemTypes];
  availableStemProperties = [...this.allStemProperties];
  
  // Cache for filter options to avoid recomputing
  private filterOptionsCache: any = null;
  

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dataService: DataService,
    private fb: FormBuilder,
    private searchService: SearchService
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
      conspicuousness: ['']
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
          console.log('Text search results:', results.length);
          // Store the base search results
          this.currentSearchResults = results;
          // After getting text search results, apply other filters
          const filteredResults = this.filterPalms(results, this.searchForm.value);
          this.totalResults = filteredResults.length;
          // Reset to first page for new search
          this.currentPage = 0;
          console.log('After all filters applied:', this.totalResults);
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
      console.log('Filter-only search results count:', this.totalResults);
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
    const heightMin = formValues.heightMin !== null ? Number(formValues.heightMin) : null;
    const heightMax = formValues.heightMax !== null ? Number(formValues.heightMax) : null;

    let results = [...palms]; // Create a copy to avoid modifying the original

    console.log('Starting filtering with', results.length, 'palms');
    console.log('Filtering criteria:', formValues);

    // Don't filter by query text here - that's handled by the searchPalms service call

    if (genus) {
      console.log('Filtering by genus:', genus);
      results = results.filter((palm: PalmTrait) => (palm.accGenus || palm.genus) === genus);
      console.log('After genus filter:', results.length);
    }

    if (tribe) {
      console.log('Filtering by tribe:', tribe);
      results = results.filter((palm: PalmTrait) => (palm.PalmTribe || palm.tribe) === tribe);
      console.log('After tribe filter:', results.length);
    }

    if (subfamily) {
      console.log('Filtering by subfamily:', subfamily);
      results = results.filter((palm: PalmTrait) => palm.PalmSubfamily === subfamily);
      console.log('After subfamily filter:', results.length);
    }

    if (stemType) {
      console.log('Filtering by stemType:', stemType);
      if (stemType === 'Climbing') {
        results = results.filter((palm: PalmTrait) => palm.Climbing === 1);
      } else if (stemType === 'Acaulescent') {
        results = results.filter((palm: PalmTrait) => palm.Acaulescent === 1);
      } else if (stemType === 'Erect') {
        results = results.filter((palm: PalmTrait) => palm.Erect === 1);
      }
      console.log('After stemType filter:', results.length);
    }

    if (stemProperty) {
      console.log('Filtering by stemProperty:', stemProperty);
      if (stemProperty === 'StemSolitary') {
        results = results.filter((palm: PalmTrait) => palm.StemSolitary === 1);
      } else if (stemProperty === 'StemArmed') {
        results = results.filter((palm: PalmTrait) => palm.StemArmed === 1);
      } else if (stemProperty === 'LeavesArmed') {
        results = results.filter((palm: PalmTrait) => palm.LeavesArmed === 1);
      }
      console.log('After stemProperty filter:', results.length);
    }

    if (understoreyCanopy) {
      console.log('Filtering by understoreyCanopy:', understoreyCanopy);
      results = results.filter((palm: PalmTrait) => palm.UnderstoreyCanopy === understoreyCanopy);
      console.log('After understoreyCanopy filter:', results.length);
    }

    if (fruitSize) {
      console.log('Filtering by fruitSize:', fruitSize);
      results = results.filter((palm: PalmTrait) => palm.FruitSizeCategorical === fruitSize);
      console.log('After fruitSize filter:', results.length);
    }

    if (conspicuousness) {
      console.log('Filtering by conspicuousness:', conspicuousness);
      results = results.filter((palm: PalmTrait) => palm.Conspicuousness === conspicuousness);
      console.log('After conspicuousness filter:', results.length);
    }

    if (heightMin !== null) {
      console.log('Filtering by heightMin:', heightMin);
      results = results.filter((palm: PalmTrait) => {
        const height = palm.MaxStemHeight_m || palm.height_max_m || 0;
        return height !== null && height >= heightMin;
      });
      console.log('After heightMin filter:', results.length);
    }

    if (heightMax !== null) {
      console.log('Filtering by heightMax:', heightMax);
      results = results.filter((palm: PalmTrait) => {
        const height = palm.MaxStemHeight_m || palm.height_max_m || 0;
        return height !== null && height <= heightMax;
      });
      console.log('After heightMax filter:', results.length);
    }

    console.log('Final filtered results count:', results.length);
    return results;
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
    if (formValues.heightMin) queryParams.heightMin = formValues.heightMin;
    if (formValues.heightMax) queryParams.heightMax = formValues.heightMax;

    // Log the query parameters for debugging
    console.log('Search initiated with queryParams:', queryParams);

    // Reset to first page
    this.currentPage = 0;
    
    // Navigate with query params
    this.router.navigate(['/palms/search'], { queryParams });

    // Mark search as done and execute search
    this.searchDone = true;
    this.executeSearch();
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
      console.log('Filter options loaded from cache');
    } else {
      // Extract all unique options from data
      this.allGenera = [...new Set(this.allPalms.map(palm => palm.accGenus || palm.genus).filter(Boolean) as string[])].sort();
      this.allPalmTribes = [...new Set(this.allPalms.map(palm => palm.PalmTribe || palm.tribe).filter(Boolean) as string[])].sort();
      this.allPalmSubfamilies = [...new Set(this.allPalms.map(palm => palm.PalmSubfamily).filter(Boolean))].sort();
      this.allHabitats = [...new Set(this.allPalms.map(palm => palm.UnderstoreyCanopy).filter(Boolean))].sort();
      this.allFruitSizes = [...new Set(this.allPalms.map(palm => palm.FruitSizeCategorical).filter(Boolean))].sort();
      this.allConspicuousness = [...new Set(this.allPalms.map(palm => palm.Conspicuousness).filter(Boolean))].sort();
      
      // Cache the results
      this.filterOptionsCache = {
        allGenera: this.allGenera,
        allPalmTribes: this.allPalmTribes,
        allPalmSubfamilies: this.allPalmSubfamilies,
        allHabitats: this.allHabitats,
        allFruitSizes: this.allFruitSizes,
        allConspicuousness: this.allConspicuousness
      };
      
      console.log('All filter options initialized and cached:', {
        genera: this.allGenera.length,
        tribes: this.allPalmTribes.length,
        subfamilies: this.allPalmSubfamilies.length,
        habitats: this.allHabitats.length,
        fruitSizes: this.allFruitSizes.length,
        conspicuousness: this.allConspicuousness.length
      });
    }

    // Initialize available options to all options (no filtering yet)
    this.resetAvailableOptions();
  }

  // Reset all available options to full lists (no filtering)
  private resetAvailableOptions(): void {
    this.availableGenera = [...this.allGenera];
    this.availablePalmTribes = [...this.allPalmTribes];
    this.availablePalmSubfamilies = [...this.allPalmSubfamilies];
    this.availableHabitats = [...this.allHabitats];
    this.availableFruitSizes = [...this.allFruitSizes];
    this.availableConspicuousness = [...this.allConspicuousness];
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