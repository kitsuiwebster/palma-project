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
  
  // Filter options (cached)
  genera: string[] = [];
  habitats: string[] = [];
  palmTribes: string[] = [];
  palmSubfamilies: string[] = [];
  fruitSizes: string[] = [];
  conspicuousness: string[] = [];
  
  // Cache for filter options to avoid recomputing
  private filterOptionsCache: any = null;
  
  // Caractéristiques binaires pour filtrer
  stemTypes = [
    { value: 'Climbing', displayName: 'Climbing' },
    { value: 'Acaulescent', displayName: 'Acaulescent' },
    { value: 'Erect', displayName: 'Erect' }
  ];
  
  stemProperties = [
    { value: 'StemSolitary', displayName: 'Solitary Stem' },
    { value: 'StemArmed', displayName: 'Armed Stem' },
    { value: 'LeavesArmed', displayName: 'Armed Leaves' }
  ];

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
      this.genera = this.filterOptionsCache.genera;
      this.palmTribes = this.filterOptionsCache.palmTribes;
      this.palmSubfamilies = this.filterOptionsCache.palmSubfamilies;
      this.habitats = this.filterOptionsCache.habitats;
      this.fruitSizes = this.filterOptionsCache.fruitSizes;
      this.conspicuousness = this.filterOptionsCache.conspicuousness;
      console.log('Filter options loaded from cache');
      return;
    }

    // Extract unique genera
    this.genera = [...new Set(this.allPalms.map(palm => palm.accGenus || palm.genus).filter(Boolean) as string[])].sort();
    
    // Extract unique palm tribes  
    this.palmTribes = [...new Set(this.allPalms.map(palm => palm.PalmTribe || palm.tribe).filter(Boolean) as string[])].sort();
    
    // Extract unique palm subfamilies
    this.palmSubfamilies = [...new Set(this.allPalms.map(palm => palm.PalmSubfamily).filter(Boolean))].sort();
    
    // Extract unique habitats/understory-canopy values
    this.habitats = [...new Set(this.allPalms.map(palm => palm.UnderstoreyCanopy).filter(Boolean))].sort();
    
    // Extract unique fruit sizes
    this.fruitSizes = [...new Set(this.allPalms.map(palm => palm.FruitSizeCategorical).filter(Boolean))].sort();
    
    // Extract unique conspicuousness values
    this.conspicuousness = [...new Set(this.allPalms.map(palm => palm.Conspicuousness).filter(Boolean))].sort();
    
    // Cache the results
    this.filterOptionsCache = {
      genera: this.genera,
      palmTribes: this.palmTribes,
      palmSubfamilies: this.palmSubfamilies,
      habitats: this.habitats,
      fruitSizes: this.fruitSizes,
      conspicuousness: this.conspicuousness
    };
    
    console.log('Filter options initialized and cached:', {
      genera: this.genera.length,
      tribes: this.palmTribes.length,
      subfamilies: this.palmSubfamilies.length,
      habitats: this.habitats.length,
      fruitSizes: this.fruitSizes.length,
      conspicuousness: this.conspicuousness.length
    });
  }
}