import { Component, OnInit } from '@angular/core';
import { SearchService } from '../../core/services/search.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Observable, combineLatest, of } from 'rxjs';
import { map, debounceTime, tap, shareReplay, switchMap } from 'rxjs/operators';
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
  allResults$!: Observable<PalmTrait[]>;
  searchResults$: Observable<PalmTrait[]>;
  loading = true;
  searchForm: FormGroup;
  searchQuery = '';
  totalResults = 0;
  
  // Pagination properties
  currentPage = 0;
  pageSize = 20;
  pageSizeOptions = [20, 50, 100];
  
  // Filter options
  genera: string[] = [];
  habitats: string[] = [];
  palmTribes: string[] = [];
  palmSubfamilies: string[] = [];
  fruitSizes: string[] = [];
  conspicuousness: string[] = [];
  
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
    // Initialiser les résultats avec un observable vide pour éviter les erreurs
    this.allResults$ = of([]);
    
    // Obtenir les options de filtre et initialiser la recherche en une seule opération
    this.dataService.getAllPalms().pipe(
      tap((palms) => {
        // Extract unique values for filter dropdowns
        this.genera = [...new Set(palms.map((p) => p.accGenus || p.genus).filter(Boolean) as string[])].sort();
        this.palmTribes = [...new Set(palms.map((p) => p.PalmTribe || p.tribe).filter(Boolean) as string[])].sort();
        this.palmSubfamilies = [...new Set(palms.map((p) => p.PalmSubfamily).filter(Boolean))].sort();
        this.habitats = [...new Set(palms.map((p) => p.UnderstoreyCanopy).filter(Boolean))].sort();
        this.fruitSizes = [...new Set(palms.map((p) => p.FruitSizeCategorical).filter(Boolean))].sort();
        this.conspicuousness = [...new Set(palms.map((p) => p.Conspicuousness).filter(Boolean))].sort();
      })
    ).subscribe();

    // Initialize search from URL parameters - une seule souscription
    this.route.queryParamMap.pipe(
      tap((params) => {
        const query = params.get('q') || '';
        this.searchQuery = query;
        this.searchForm.patchValue({ query });

        // Get pagination params from URL
        if (params.has('page')) {
          this.currentPage = Number(params.get('page')) || 0;
        }
        if (params.has('pageSize')) {
          this.pageSize = Number(params.get('pageSize')) || 20;
        }

        // Apply other filters from URL if they exist
        if (params.has('genus'))
          this.searchForm.patchValue({ genus: params.get('genus') });
        if (params.has('tribe'))
          this.searchForm.patchValue({ tribe: params.get('tribe') });
        if (params.has('subfamily'))
          this.searchForm.patchValue({ subfamily: params.get('subfamily') });
        if (params.has('stemType'))
          this.searchForm.patchValue({ stemType: params.get('stemType') });
        if (params.has('stemProperty'))
          this.searchForm.patchValue({ stemProperty: params.get('stemProperty') });
        if (params.has('understoreyCanopy'))
          this.searchForm.patchValue({ understoreyCanopy: params.get('understoreyCanopy') });
        if (params.has('fruitSize'))
          this.searchForm.patchValue({ fruitSize: params.get('fruitSize') });
        if (params.has('conspicuousness'))
          this.searchForm.patchValue({ conspicuousness: params.get('conspicuousness') });
        if (params.has('heightMin'))
          this.searchForm.patchValue({ heightMin: Number(params.get('heightMin')) });
        if (params.has('heightMax'))
          this.searchForm.patchValue({ heightMax: Number(params.get('heightMax')) });
      }),
      // Utiliser switchMap pour éviter les souscriptions multiples
      switchMap((params) => {
        const query = params.get('q') || '';
        
        // Recherche complète sans limite, stockée dans allResults$
        if (query && query.trim().length > 0) {
          return this.dataService.searchPalms(query, null).pipe(
            tap(results => {
              this.searchService.updateSearchResults(results);
              this.loading = false; // Marquer le chargement comme terminé
              this.totalResults = results ? results.length : 0;
              this.searchDone = true;
            }),
          shareReplay(1) // Partager le même résultat avec tous les abonnés
          );
        } else {
          this.searchDone = false;
          return this.dataService.getAllPalms().pipe(
            tap(() => this.loading = false), // Marquer le chargement comme terminé
            shareReplay(1) // Partager le même résultat avec tous les abonnés
          );
        }
      })
    ).subscribe(results => {
      // Mettre à jour allResults$ avec les résultats
      this.allResults$ = of(results);
      this.totalResults = results.length;
    });

    // Subscribe to form changes and search results
    this.searchResults$ = combineLatest([
      this.route.queryParamMap,
      this.dataService.getAllPalms(),
    ]).pipe(
      debounceTime(300),
      map(([params, allPalms]) => {
        this.loading = false;

        const query = params.get('q') || '';
        const genus = params.get('genus') || '';
        const tribe = params.get('tribe') || '';
        const subfamily = params.get('subfamily') || '';
        const stemType = params.get('stemType') || '';
        const stemProperty = params.get('stemProperty') || '';
        const understoreyCanopy = params.get('understoreyCanopy') || '';
        const fruitSize = params.get('fruitSize') || '';
        const conspicuousness = params.get('conspicuousness') || '';
        const heightMin = params.has('heightMin') ? Number(params.get('heightMin')) : null;
        const heightMax = params.has('heightMax') ? Number(params.get('heightMax')) : null;

        // Filter palms based on all criteria
        let results = allPalms;

        if (query) {
          const searchQuery = query.toLowerCase();
          results = results.filter(
            (palm) =>
              (palm.SpecName && palm.SpecName.toLowerCase().includes(searchQuery)) ||
              (palm.accGenus && palm.accGenus.toLowerCase().includes(searchQuery)) ||
              (palm.accSpecies && palm.accSpecies.toLowerCase().includes(searchQuery)) ||
              (palm.PalmTribe && palm.PalmTribe.toLowerCase().includes(searchQuery)) ||
              (palm.PalmSubfamily && palm.PalmSubfamily.toLowerCase().includes(searchQuery))
          );
        }

        if (genus) {
          results = results.filter((palm) => (palm.accGenus || palm.genus) === genus);
        }

        if (tribe) {
          results = results.filter((palm) => (palm.PalmTribe || palm.tribe) === tribe);
        }

        if (subfamily) {
          results = results.filter((palm) => palm.PalmSubfamily === subfamily);
        }

        if (stemType) {
          if (stemType === 'Climbing') {
            results = results.filter((palm) => palm.Climbing === 1);
          } else if (stemType === 'Acaulescent') {
            results = results.filter((palm) => palm.Acaulescent === 1);
          } else if (stemType === 'Erect') {
            results = results.filter((palm) => palm.Erect === 1);
          }
        }

        if (stemProperty) {
          if (stemProperty === 'StemSolitary') {
            results = results.filter((palm) => palm.StemSolitary === 1);
          } else if (stemProperty === 'StemArmed') {
            results = results.filter((palm) => palm.StemArmed === 1);
          } else if (stemProperty === 'LeavesArmed') {
            results = results.filter((palm) => palm.LeavesArmed === 1);
          }
        }

        if (understoreyCanopy) {
          results = results.filter((palm) => palm.UnderstoreyCanopy === understoreyCanopy);
        }

        if (fruitSize) {
          results = results.filter((palm) => palm.FruitSizeCategorical === fruitSize);
        }

        if (conspicuousness) {
          results = results.filter((palm) => palm.Conspicuousness === conspicuousness);
        }

        if (heightMin !== null) {
          results = results.filter((palm) => {
            const height = palm.MaxStemHeight_m || palm.height_max_m || 0;
            return height !== null && height >= heightMin;
          });
        }

        if (heightMax !== null) {
          results = results.filter((palm) => {
            const height = palm.MaxStemHeight_m || palm.height_max_m || 0;
            return height !== null && height <= heightMax;
          });
        }

        this.totalResults = results.length;
        return results;
      })
    );
  }

  onSearch(): void {
    const formValues = this.searchForm.value;

    // Build query params object with only non-empty values
    const queryParams: any = {};

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

    // Reset to first page when searching
    this.currentPage = 0;
    queryParams['page'] = this.currentPage;
    queryParams['pageSize'] = this.pageSize;

    // Navigate with updated query params
    this.router.navigate(['/palms/search'], { queryParams });
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
        'page': this.currentPage,
        'pageSize': this.pageSize
      },
    });
  }

  // Pagination helper methods
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

  // Helper function for pagination range label
  min(a: number, b: number): number {
    return Math.min(a, b);
  }
}