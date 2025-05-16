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
      
      // Extract the genus and species (first two columns)
      const parts = line.split(' ');
      if (parts.length < 2) continue;
      
      const genus = parts[0];
      const species = parts[1];
      const speciesName = `${genus} ${species}`;
      
      // Extract all URLs from the Photos column
      // Look for URLs starting with https://
      const urlMatches = line.match(/https:\/\/[^\s]+/g) || [];
      if (urlMatches.length === 0) continue;
      
      // Extract photographer information from PhotoReferences column
      let photographerInfo = 'Unknown';
      let license = 'Unknown';
      
      if (line.includes('(c)')) {
        const photoRefStart = line.indexOf('(c)');
        const photoRefSection = line.substring(photoRefStart);
        
        // Extract photographer
        photographerInfo = photoRefSection.trim();
        
        // Extract license - look for patterns like (CC BY-NC)
        const licenseMatch = photographerInfo.match(/\((CC [^)]+)\)/);
        if (licenseMatch && licenseMatch[1]) {
          license = licenseMatch[1];
        }
      }
      
      // Create a credit entry for each URL
      urlMatches.forEach(url => {
        // Determine the source (iNaturalist or Wikimedia)
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
      });
    }
    
    return photoCredits;
  }
}