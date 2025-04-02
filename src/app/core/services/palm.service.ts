// src/app/core/services/palm.service.ts
import { Injectable } from '@angular/core';
import { Observable, map, of, shareReplay } from 'rxjs';

import { DataService } from './data.service';
import { PalmTrait } from '../models/palm-trait.model';


@Injectable({
  providedIn: 'root'
})
export class PalmService {
  private cachedGenera$: Observable<string[]> | null = null;
  private cachedHabitats$: Observable<string[]> | null = null;
  private cachedConservationStatuses$: Observable<string[]> | null = null;
  private cachedRegions$: Observable<string[]> | null = null;

  constructor(private dataService: DataService) {}

  /**
   * Get a list of all unique genera
   */
  getGenera(): Observable<string[]> {
    if (!this.cachedGenera$) {
      this.cachedGenera$ = this.dataService.getAllPalms().pipe(
        map(palms => [...new Set(
          palms.map(p => p.genus).filter((g): g is string => !!g)
        )].sort()),
        shareReplay(1)
      );
    }
    return this.cachedGenera$;
  }
  

  /**
   * Get a list of all unique habitats
   */
  getHabitats(): Observable<string[]> {
    if (!this.cachedHabitats$) {
      this.cachedHabitats$ = this.dataService.getAllPalms().pipe(
        map(palms => [...new Set(
          palms.map(p => p.habitat)
            .filter((h): h is string => !!h && h !== 'Unknown')
        )].sort()),
        shareReplay(1)
      );
    }
    return this.cachedHabitats$;
  }
  

  /**
   * Get a list of all unique conservation statuses
   */
  getConservationStatuses(): Observable<string[]> {
    if (!this.cachedConservationStatuses$) {
      this.cachedConservationStatuses$ = this.dataService.getAllPalms().pipe(
        map(palms => [...new Set(
          palms.map(p => p.conservation_status)
            .filter((s): s is string => !!s && s !== 'Unknown')
        )].sort()),
        shareReplay(1)
      );
    }
    return this.cachedConservationStatuses$;
  }
  

  /**
   * Get a list of all unique regions
   */
  getRegions(): Observable<string[]> {
    if (!this.cachedRegions$) {
      this.cachedRegions$ = this.dataService.getAllPalms().pipe(
        map(palms => {
          const allRegions = palms
            .map(p => p.distribution)
            .filter((d): d is string => !!d)
            .flatMap(d => d.split(',').map(r => r.trim()));
          return [...new Set(allRegions)].filter(r => r !== 'Unknown').sort();
        }),
        shareReplay(1)
      );
    }
    return this.cachedRegions$;
  }
  

  /**
   * Get highest palm height in the dataset
   */
  getMaxHeight(): Observable<number> {
    return this.dataService.getAllPalms().pipe(
      map(palms => {
        const heights = palms
          .map(p => p.height_max_m)
          .filter(h => h !== null && h !== undefined && !isNaN(h)) as number[];
        return Math.max(...heights);
      })
    );
  }

  /**
   * Get palms by conservation status
   */
  getPalmsByConservationStatus(): Observable<{[status: string]: PalmTrait[]}> {
    return this.dataService.getAllPalms().pipe(
      map(palms => {
        return palms.reduce((acc, palm) => {
          const status = palm.conservation_status || 'Unknown';
          if (!acc[status]) {
            acc[status] = [];
          }
          acc[status].push(palm);
          return acc;
        }, {} as {[status: string]: PalmTrait[]});
      })
    );
  }

  /**
   * Filter palms by multiple criteria
   */
  filterPalms(criteria: {
    query?: string;
    genus?: string;
    habitat?: string;
    region?: string;
    conservationStatus?: string;
    heightMin?: number | null;
    heightMax?: number | null;
  }): Observable<PalmTrait[]> {
    return this.dataService.getAllPalms().pipe(
      map(palms => {
        let results = [...palms];
        
        if (criteria.query) {
          const searchQuery = criteria.query.toLowerCase();
          results = results.filter(palm =>
            (palm.species?.toLowerCase().includes(searchQuery)) ||
            (palm.genus?.toLowerCase().includes(searchQuery)) ||
            (palm.tribe?.toLowerCase().includes(searchQuery)) ||
            (palm.distribution?.toLowerCase().includes(searchQuery)) ||
            (palm.habitat?.toLowerCase().includes(searchQuery)) ||
            (palm.description?.toLowerCase().includes(searchQuery))
          );
        }
        
        
        
        if (criteria.genus) {
          results = results.filter(palm => palm.genus === criteria.genus);
        }
        
        if (criteria.habitat) {
          results = results.filter(palm => palm.habitat?.includes(criteria.habitat || ''));
        }
        
        if (criteria.region) {
          results = results.filter(palm => palm.distribution?.includes(criteria.region || ''));
        }
        
        if (criteria.conservationStatus) {
          results = results.filter(palm => palm.conservation_status === criteria.conservationStatus);
        }
        
        if (criteria.heightMin !== null && criteria.heightMin !== undefined) {
          results = results.filter(palm => (palm.height_max_m || 0) >= (criteria.heightMin || 0));
        }
        
        if (criteria.heightMax !== null && criteria.heightMax !== undefined) {
          results = results.filter(palm => (palm.height_max_m || 0) <= (criteria.heightMax || 0));
        }
        
        return results;
      })
    );
  }

  /**
   * Get statistical information about the palm database
   */
  getPalmStatistics(): Observable<{
    totalSpecies: number;
    totalGenera: number;
    maxHeight: number;
    endangeredCount: number;
    vulnerableCount: number;
    safeCount: number;
    unknownCount: number;
  }> {
    return this.dataService.getAllPalms().pipe(
      map(palms => {
        const genera = new Set(palms.map(p => p.genus));
        const heights = palms
          .map(p => p.height_max_m)
          .filter(h => h !== null && h !== undefined && !isNaN(h)) as number[];
        
        let endangeredCount = 0;
        let vulnerableCount = 0;
        let safeCount = 0;
        let unknownCount = 0;
        
        palms.forEach(palm => {
          const status = (palm.conservation_status || '').toLowerCase();
          if (status.includes('extinct') || status.includes('endangered') || status.includes('critically')) {
            endangeredCount++;
          } else if (status.includes('vulnerable') || status.includes('near threatened')) {
            vulnerableCount++;
          } else if (status.includes('concern') || status.includes('safe')) {
            safeCount++;
          } else {
            unknownCount++;
          }
        });
        
        return {
          totalSpecies: palms.length,
          totalGenera: genera.size,
          maxHeight: Math.max(...heights),
          endangeredCount,
          vulnerableCount,
          safeCount,
          unknownCount
        };
      })
    );
  }
}