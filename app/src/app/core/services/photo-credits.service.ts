import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { provideHttpClient } from '@angular/common/http';

export interface PhotoCredit {
  species: string;
  photoUrl: string;
  photographer: string;
  license: string;
  source: 'iNaturalist' | 'Wikimedia' | 'Other';
}

@Injectable({
  providedIn: 'root'
})
export class PhotoCreditsService {
  private datasetPath = 'assets/data/dataset.txt';
  
  constructor(private http: HttpClient) { }

  /**
   * Get photo credits from the dataset file
   * @returns Observable of PhotoCredit array
   */
  getPhotoCredits(): Observable<PhotoCredit[]> {
    return this.http.get(this.datasetPath, { responseType: 'text' })
      .pipe(
        map(data => this.parsePhotoCredits(data)),
        catchError(error => {
          console.error('Error loading dataset:', error);
          return of([]); // Return empty array on error
        })
      );
  }
  
  /**
   * Parse the dataset string to extract photo credits information
   * @param datasetContent The content of the dataset file
   * @returns Array of PhotoCredit objects
   */
  parsePhotoCredits(datasetContent: string): PhotoCredit[] {
    const photoCredits: PhotoCredit[] = [];
    
    // Split by line
    const lines = datasetContent.split('\n');
    
    // Skip the header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      
      // Split line by tabs to get proper columns
      const columns = line.split('\t');
      if (columns.length < 11) continue;
      
      const speciesName = columns[0];
      const photosColumn = columns[9] || '';
      const photoReferencesColumn = columns[10] || '';
      
      // Extract photo URLs
      const photoUrls = photosColumn.split(' ').filter(url => url.trim().startsWith('http'));
      if (photoUrls.length === 0) continue;
      
      // Parse photo references - split by (c) pattern but keep (c) in each reference
      const photoRefs: string[] = [];
      if (photoReferencesColumn.trim()) {
        const refParts = photoReferencesColumn.split('(c)').filter(part => part.trim());
        for (let j = 0; j < refParts.length; j++) {
          if (j === 0 && !photoReferencesColumn.startsWith('(c)')) {
            // First part might not start with (c) if it's a continuation
            photoRefs.push(refParts[j].trim());
          } else {
            photoRefs.push('(c)' + refParts[j].trim());
          }
        }
      }
      
      // Map photos to references in sequence
      for (let urlIndex = 0; urlIndex < photoUrls.length; urlIndex++) {
        const url = photoUrls[urlIndex];
        
        // Map photo to corresponding reference, or reuse last reference if fewer refs than photos
        const refIndex = Math.min(urlIndex, photoRefs.length - 1);
        const photographerInfo = photoRefs[refIndex] || 'Unknown';
        
        // Extract license from photographer info
        let license = 'Unknown';
        const licenseMatch = photographerInfo.match(/\((CC [^)]+)\)/);
        if (licenseMatch && licenseMatch[1]) {
          license = licenseMatch[1];
        }
        
        // Determine the source
        let source: 'iNaturalist' | 'Wikimedia' | 'Other' = 'Other';
        if (url.includes('inaturalist')) {
          source = 'iNaturalist';
        } else if (url.includes('wikimedia') || url.includes('wikipedia')) {
          source = 'Wikimedia';
        }
        
        photoCredits.push({
          species: speciesName,
          photoUrl: url,
          photographer: photographerInfo,
          license: license,
          source
        });
      }
    }
    
    return photoCredits;
  }
}