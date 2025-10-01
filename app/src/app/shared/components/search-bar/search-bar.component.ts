import { Component, OnInit } from '@angular/core';
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
export class SearchBarComponent implements OnInit {
  searchControl = new FormControl('');
  loading = false;

  constructor(
    private dataService: DataService, 
    private router: Router,
    private searchService: SearchService
  ) {}

  ngOnInit(): void {
    // Basic initialization without suggestions
  }

  onSearchSubmit(): void {
    const searchTerm = this.searchControl.value?.trim();
    if (searchTerm && searchTerm.length > 0) {
      this.loading = true;
      
      this.dataService.searchPalms(searchTerm).subscribe({
        next: (results) => {
          this.searchService.updateSearchResults(results);
          this.router.navigate(['/palms/search'], {
            queryParams: { q: searchTerm }
          });
          this.loading = false;
        },
        error: (error) => {
          console.error('Search error:', error);
          this.loading = false;
        }
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