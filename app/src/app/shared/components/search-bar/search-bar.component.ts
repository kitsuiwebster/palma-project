import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataService } from '../../../core/services/data.service';
import { SearchService } from '../../../core/services/search.service';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, filter } from 'rxjs/operators';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss',
})
export class SearchBarComponent implements OnInit, OnDestroy {
  searchControl = new FormControl('');
  loading = false;
  private searchSubscription: Subscription = new Subscription();

  constructor(
    private dataService: DataService, 
    private router: Router,
    private searchService: SearchService
  ) {}

  ngOnInit(): void {
    // Set up real-time search with debouncing
    const realTimeSearch = this.searchControl.valueChanges.pipe(
      debounceTime(300), // Wait 300ms after user stops typing
      distinctUntilChanged(), // Only emit if value has changed
      filter(term => term !== null && term.trim().length >= 2), // Only search for terms with 2+ characters
      switchMap(term => {
        this.loading = true;
        // TypeScript guard: term is guaranteed to be non-null due to filter above
        const searchTerm = term!.trim();
        return this.dataService.searchPalms(searchTerm, null);
      })
    ).subscribe({
      next: (results) => {
        this.searchService.updateSearchResults(results);
        this.loading = false;
      },
      error: (error) => {
        console.error('Real-time search error:', error);
        this.loading = false;
      }
    });

    // Also listen for empty search to clear results
    const clearSearch = this.searchControl.valueChanges.pipe(
      debounceTime(100),
      filter(term => term === null || term.trim().length === 0)
    ).subscribe(() => {
      this.searchService.clearSearchResults();
      this.loading = false;
    });

    // Add both subscriptions to the main subscription
    this.searchSubscription.add(realTimeSearch);
    this.searchSubscription.add(clearSearch);
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  onSearchSubmit(): void {
    const searchTerm = this.searchControl.value?.trim();
    if (searchTerm && searchTerm.length > 0) {
      // Navigate to advanced search page with the query
      this.router.navigate(['/palms/search'], {
        queryParams: { q: searchTerm }
      });
    }
  }

  onEnterPressed(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onSearchSubmit();
    }
  }
}