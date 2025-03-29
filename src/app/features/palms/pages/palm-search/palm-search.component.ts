// src/app/features/palms/pages/palm-search/palm-search.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Observable, combineLatest, of } from 'rxjs';
import { map, debounceTime } from 'rxjs/operators';
import { DataService, PalmTrait } from '../../../../core/services/data.service';
import { PalmCardComponent } from '../../../../shared/components/palm-card/palm-card.component';
import { MatIcon } from '@angular/material/icon';
import {
  MatButton,
  MatIconButton,
} from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import {
  MatFormField,
  MatLabel,
  MatSuffix,
} from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';


@Component({
  selector: 'app-palm-search',
  templateUrl: './palm-search.component.html',
  styleUrls: ['./palm-search.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    PalmCardComponent,
    RouterModule,
    MatIcon,
    MatButton,
    MatIconButton,
    MatProgressSpinner,
    MatFormField,
    MatLabel,
    MatSuffix,
    MatInput,
    MatSelect,
    MatOption,
    ReactiveFormsModule
  ],
})
export class PalmSearchComponent implements OnInit {
  searchResults$: Observable<PalmTrait[]>;
  loading = true;
  searchForm: FormGroup;
  searchQuery = '';
  totalResults = 0;

  // Filter options
  genera: string[] = [];
  habitats: string[] = [];
  regions: string[] = [];
  conservationStatuses: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dataService: DataService,
    private fb: FormBuilder
  ) {
    this.searchForm = this.fb.group({
      query: [''],
      genus: [''],
      habitat: [''],
      region: [''],
      conservationStatus: [''],
      heightMin: [null],
      heightMax: [null],
    });

    this.searchResults$ = of([]);
  }

  ngOnInit(): void {
    // Get filter options from data
    this.dataService.getAllPalms().subscribe((palms) => {
      // Extract unique values for filter dropdowns
      this.genera = [...new Set(palms.map((p) => p.genus))].sort();
      this.habitats = [
        ...new Set(palms.map((p) => p.habitat).filter((h) => h !== 'Unknown')),
      ].sort();

      // Extract regions from distribution field
      const allRegions = palms.flatMap((p) =>
        p.distribution.split(',').map((r) => r.trim())
      );
      this.regions = [...new Set(allRegions)]
        .filter((r) => r !== 'Unknown')
        .sort();

      this.conservationStatuses = [
        ...new Set(palms.map((p) => p.conservation_status)),
      ]
        .filter((s) => s !== 'Unknown')
        .sort();
    });

    // Initialize search from URL parameters
    this.route.queryParamMap.subscribe((params) => {
      const query = params.get('q') || '';
      this.searchQuery = query;
      this.searchForm.patchValue({ query });

      // Apply other filters from URL if they exist
      if (params.has('genus'))
        this.searchForm.patchValue({ genus: params.get('genus') });
      if (params.has('habitat'))
        this.searchForm.patchValue({ habitat: params.get('habitat') });
      if (params.has('region'))
        this.searchForm.patchValue({ region: params.get('region') });
      if (params.has('conservationStatus'))
        this.searchForm.patchValue({
          conservationStatus: params.get('conservationStatus'),
        });
      if (params.has('heightMin'))
        this.searchForm.patchValue({
          heightMin: Number(params.get('heightMin')),
        });
      if (params.has('heightMax'))
        this.searchForm.patchValue({
          heightMax: Number(params.get('heightMax')),
        });
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
        const habitat = params.get('habitat') || '';
        const region = params.get('region') || '';
        const conservationStatus = params.get('conservationStatus') || '';
        const heightMin = params.has('heightMin')
          ? Number(params.get('heightMin'))
          : null;
        const heightMax = params.has('heightMax')
          ? Number(params.get('heightMax'))
          : null;

        // Filter palms based on all criteria
        let results = allPalms;

        if (query) {
          const searchQuery = query.toLowerCase();
          results = results.filter(
            (palm) =>
              palm.species.toLowerCase().includes(searchQuery) ||
              palm.genus.toLowerCase().includes(searchQuery) ||
              palm.tribe.toLowerCase().includes(searchQuery) ||
              palm.distribution.toLowerCase().includes(searchQuery) ||
              palm.habitat.toLowerCase().includes(searchQuery) ||
              (palm.description &&
                palm.description.toLowerCase().includes(searchQuery))
          );
        }

        if (genus) {
          results = results.filter((palm) => palm.genus === genus);
        }

        if (habitat) {
          results = results.filter((palm) => palm.habitat.includes(habitat));
        }

        if (region) {
          results = results.filter((palm) =>
            palm.distribution.includes(region)
          );
        }

        if (conservationStatus) {
          results = results.filter(
            (palm) => palm.conservation_status === conservationStatus
          );
        }

        if (heightMin !== null) {
          results = results.filter((palm) => palm.height_max_m >= heightMin);
        }

        if (heightMax !== null) {
          results = results.filter((palm) => palm.height_max_m <= heightMax);
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
    if (formValues.habitat) queryParams.habitat = formValues.habitat;
    if (formValues.region) queryParams.region = formValues.region;
    if (formValues.conservationStatus)
      queryParams.conservationStatus = formValues.conservationStatus;
    if (formValues.heightMin) queryParams.heightMin = formValues.heightMin;
    if (formValues.heightMax) queryParams.heightMax = formValues.heightMax;

    // Navigate with updated query params
    this.router.navigate(['/palms/search'], { queryParams });
  }

  clearFilters(): void {
    this.searchForm.patchValue({
      genus: '',
      habitat: '',
      region: '',
      conservationStatus: '',
      heightMin: null,
      heightMax: null,
    });

    // Keep only the search query
    this.router.navigate(['/palms/search'], {
      queryParams: { q: this.searchForm.value.query },
    });
  }
}
