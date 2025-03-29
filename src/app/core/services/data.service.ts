// src/app/core/services/data.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import * as Papa from 'papaparse';

export interface PalmTrait {
  species: string;
  genus: string;
  tribe: string;
  subfamily: string;
  family: string;
  height_max_m: number;
  stem_diameter_max_cm: number;
  leaf_number_max: number;
  leaf_length_max_m: number;
  fruit_length_max_cm: number;
  fruit_diameter_max_cm: number;
  range_size_km2: number;
  distribution: string;
  habitat: string;
  uses: string;
  conservation_status: string;
  image_url?: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private palmsData: PalmTrait[] = [];
  private dataUrl = 'assets/data/palmtraits.csv'; // Path to your dataset

  constructor(private http: HttpClient) { }

  /**
   * Load and parse PalmTraits data from CSV
   */
  loadPalmsData(): Observable<PalmTrait[]> {
    if (this.palmsData.length > 0) {
      return of(this.palmsData);
    }

    return this.http.get('assets/data/PalmTraits_1.0.txt', { responseType: 'text' })
      .pipe(
        map(csv => {
          const results = Papa.parse(csv, {
            header: true,
            delimiter: '\t',
            dynamicTyping: true,
            skipEmptyLines: true
          });
          
          // Process and clean data
          this.palmsData = results.data.map((palm: any) => {
            return {
              species: palm.species || '',
              genus: palm.genus || '',
              tribe: palm.tribe || '',
              subfamily: palm.subfamily || '',
              family: palm.family || 'Arecaceae',
              height_max_m: palm.height_max_m || null,
              stem_diameter_max_cm: palm.stem_diameter_max_cm || null,
              leaf_number_max: palm.leaf_number_max || null,
              leaf_length_max_m: palm.leaf_length_max_m || null,
              fruit_length_max_cm: palm.fruit_length_max_cm || null,
              fruit_diameter_max_cm: palm.fruit_diameter_max_cm || null,
              range_size_km2: palm.range_size_km2 || null,
              distribution: palm.distribution || 'Unknown',
              habitat: palm.habitat || 'Unknown',
              uses: palm.uses || 'Unknown',
              conservation_status: palm.conservation_status || 'Unknown',
              image_url: palm.image_url || 'assets/images/palm-placeholder.jpg',
              description: palm.description || 'No description available.'
            };
          });
          
          return this.palmsData;
        }),
        catchError(error => {
          console.error('Error loading palm data:', error);
          return throwError(() => new Error('Failed to load palm data. Please try again later.'));
        })
      );
  }

  /**
   * Get all palm species
   */
  getAllPalms(): Observable<PalmTrait[]> {
    return this.loadPalmsData();
  }

  /**
   * Get palm by species name
   */
  getPalmBySpecies(species: string): Observable<PalmTrait | undefined> {
    return this.loadPalmsData().pipe(
      map(palms => palms.find(palm => 
        palm.species.toLowerCase() === species.toLowerCase()
      ))
    );
  }

  /**
   * Search palms by term (genus, species, or other attributes)
   */
  searchPalms(term: string): Observable<PalmTrait[]> {
    if (!term.trim()) {
      return of([]);
    }
    
    const searchTerm = term.toLowerCase();
    return this.loadPalmsData().pipe(
      map(palms => palms.filter(palm => 
        palm.species.toLowerCase().includes(searchTerm) ||
        palm.genus.toLowerCase().includes(searchTerm) ||
        palm.tribe.toLowerCase().includes(searchTerm) ||
        palm.subfamily.toLowerCase().includes(searchTerm) ||
        palm.distribution.toLowerCase().includes(searchTerm) ||
        palm.habitat.toLowerCase().includes(searchTerm) ||
        palm.uses.toLowerCase().includes(searchTerm)
      ))
    );
  }

  /**
   * Get palms grouped by genus
   */
  getPalmsByGenus(): Observable<{[genus: string]: PalmTrait[]}> {
    return this.loadPalmsData().pipe(
      map(palms => {
        return palms.reduce((acc, palm) => {
          const genus = palm.genus;
          if (!acc[genus]) {
            acc[genus] = [];
          }
          acc[genus].push(palm);
          return acc;
        }, {} as {[genus: string]: PalmTrait[]});
      })
    );
  }
}