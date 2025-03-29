// src/app/shared/components/search-bar/search-bar.component.ts
import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  switchMap,
  tap,
} from 'rxjs/operators';
import { DataService, PalmTrait } from '../../../core/services/data.service';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import {
  MatFormField,
  MatPrefix,
  MatSuffix,
} from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatIconButton } from '@angular/material/button';
import { MatList, MatListItem } from '@angular/material/list';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIcon,
    MatFormField,
    MatPrefix,
    MatSuffix,
    MatInput,
    MatProgressSpinner,
    MatIconButton,
    MatList,
    MatListItem,
  ],
})
export class SearchBarComponent implements OnInit {
  searchControl = new FormControl('');
  searchResults$: Observable<PalmTrait[]>;
  private searchTerms = new Subject<string>();
  loading = false;

  constructor(private dataService: DataService, private router: Router) {
    this.searchResults$ = this.searchTerms.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter((term) => term.length > 2),
      tap(() => (this.loading = true)),
      switchMap((term) => this.dataService.searchPalms(term)),
      tap(() => (this.loading = false))
    );
  }

  ngOnInit(): void {
    this.searchControl.valueChanges.subscribe((term) => {
      if (term) {
        this.searchTerms.next(term);
      }
    });
  }

  search(term: string): void {
    this.searchTerms.next(term);
  }

  onSearchSubmit(): void {
    const term = this.searchControl.value;
    if (term && term.trim().length > 0) {
      this.router.navigate(['/palms/search'], { queryParams: { q: term } });
    }
  }

  goToPalmDetail(palm: PalmTrait): void {
    // Assuming you have a slugify pipe to convert species name to URL-friendly format
    const speciesSlug = palm.species.toLowerCase().replace(/\s+/g, '-');
    this.router.navigate(['/palms', speciesSlug]);
    this.searchControl.setValue('');
  }
}
