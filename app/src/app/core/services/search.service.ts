import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PalmTrait } from '../models/palm-trait.model';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  // BehaviorSubject pour partager les résultats de recherche entre composants
  private searchResultsSource = new BehaviorSubject<PalmTrait[] | null>(null);
  
  // Observable que les autres composants peuvent écouter
  searchResults$ = this.searchResultsSource.asObservable();
  
  constructor() { }
  
  // Méthode pour mettre à jour les résultats de recherche
  updateSearchResults(results: PalmTrait[] | null): void {
    console.log("SearchService: updateSearchResults called with", results ? results.length : 0, "results");
    this.searchResultsSource.next(results);
  }
  
  // Méthode pour effacer les résultats de recherche
  clearSearchResults(): void {
    this.searchResultsSource.next(null);
  }

  
}