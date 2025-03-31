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
import { DataService } from '../../../core/services/data.service';
import { PalmTrait } from '../../../core/models/palm-trait.model';
import { CommonModule } from '@angular/common';
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
    // Obtenir le nom d'espèce, en tenant compte de la structure de données
    const speciesName = palm.SpecName || palm.species || '';
    // Convertir en slug URL-friendly
    const speciesSlug = this.slugify(speciesName);
    this.router.navigate(['/palms', speciesSlug]);
    this.searchControl.setValue('');
  }

  // Obtenir le nom d'espèce pour l'affichage
  getSpeciesName(palm: PalmTrait): string {
    return palm.SpecName || palm.species || 'Unknown Species';
  }

  // Obtenir le genre pour l'affichage
  getGenusName(palm: PalmTrait): string {
    return palm.accGenus || palm.genus || 'Unknown Genus';
  }

  // Fonction utilitaire pour convertir un texte en format slug
  private slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-') // Remplacer les espaces par des tirets
      .replace(/[^\w\-]+/g, '') // Supprimer tous les caractères non-word
      .replace(/\-\-+/g, '-') // Remplacer les tirets multiples par un seul
      .replace(/^-+/, '') // Supprimer les tirets au début
      .replace(/-+$/, ''); // Supprimer les tirets à la fin
  }
}