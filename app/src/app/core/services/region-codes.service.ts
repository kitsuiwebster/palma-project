import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, shareReplay } from 'rxjs';

interface RegionData {
  name: string;
  flag: string;
}

@Injectable({
  providedIn: 'root',
})
export class RegionCodesService {
  private regionCodes: { [key: string]: RegionData } = {};
  private isLoaded = false;
  private loadPromise: Promise<void> | null = null;

  constructor(private http: HttpClient) {}

  /**
   * Clear cache and reload region codes (for testing)
   */
  clearCache(): void {
    this.isLoaded = false;
    this.loadPromise = null;
    this.regionCodes = {};
  }

  private loadRegionCodes(): Promise<void> {
    if (this.isLoaded) {
      return Promise.resolve();
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this.http.get<{ [key: string]: RegionData }>('assets/data/region_codes.json')
      .toPromise()
      .then(data => {
        this.regionCodes = data || {};
        this.isLoaded = true;
      })
      .catch(error => {
        console.error('Failed to load region codes:', error);
        this.isLoaded = true;
      });

    return this.loadPromise;
  }

  /**
   * Convert comma-separated region codes to readable names with flags
   * @param codes - Comma-separated region codes (e.g., "HAI, FRA")
   * @param includeFlags - Whether to include flag images
   * @returns HTML string with region names and optional flags
   */
  async convertCodesToDisplay(codes: string, includeFlags: boolean = true): Promise<string> {
    await this.loadRegionCodes();

    if (!codes || codes.trim() === '') {
      return '';
    }

    const codeList = codes.split(',').map(code => code.trim());
    const results: string[] = [];

    for (const code of codeList) {
      const regionData = this.regionCodes[code];
      if (regionData) {
        if (includeFlags && regionData.flag) {
          const flagImg = `<img src="${regionData.flag}" class="flag-img" alt="${regionData.name} flag">`;
          results.push(`${flagImg} ${regionData.name}`);
        } else {
          results.push(regionData.name);
        }
      } else {
        // Fallback: display the code itself if not found
        console.warn(`Unknown region code: ${code}`);
        results.push(code);
      }
    }

    return results.join(', ');
  }

  /**
   * Convert comma-separated region codes to readable names with flags, limited to maxCount
   * @param codes - Comma-separated region codes (e.g., "HAI, FRA")
   * @param includeFlags - Whether to include flag images
   * @param maxCount - Maximum number of regions to display (default: 5)
   * @returns HTML string with region names and optional "and X more" message
   */
  async convertCodesToDisplayLimited(codes: string, includeFlags: boolean = true, maxCount: number = 5): Promise<string> {
    await this.loadRegionCodes();

    if (!codes || codes.trim() === '') {
      return '';
    }

    const codeList = codes.split(',').map(code => code.trim());
    const results: string[] = [];

    // Process only the first maxCount regions
    const displayCodes = codeList.slice(0, maxCount);
    const remainingCount = codeList.length - maxCount;

    for (const code of displayCodes) {
      const regionData = this.regionCodes[code];
      if (regionData) {
        if (includeFlags && regionData.flag) {
          const flagImg = `<img src="${regionData.flag}" class="flag-img" alt="${regionData.name} flag">`;
          results.push(`<div class="region-item">${flagImg} ${regionData.name}</div>`);
        } else {
          results.push(`<div class="region-item">${regionData.name}</div>`);
        }
      } else {
        // Fallback: display the code itself if not found
        console.warn(`Unknown region code: ${code}`);
        results.push(`<div class="region-item">${code}</div>`);
      }
    }

    let output = `<div class="region-list">${results.join('')}</div>`;

    // Add "and X more" message if there are more regions
    if (remainingCount > 0) {
      output += `<div class="region-more">and ${remainingCount} more</div>`;
    }

    return output;
  }

  /**
   * Get flag URL for a specific region code
   * @param code - Region code (e.g., "HAI")
   * @returns Flag URL or empty string
   */
  async getFlagUrl(code: string): Promise<string> {
    await this.loadRegionCodes();
    const regionData = this.regionCodes[code];
    return regionData ? regionData.flag : '';
  }

  /**
   * Get region name for a specific region code
   * @param code - Region code (e.g., "HAI")
   * @returns Region name or the code itself if not found
   */
  async getRegionName(code: string): Promise<string> {
    await this.loadRegionCodes();
    const regionData = this.regionCodes[code];
    return regionData ? regionData.name : code;
  }

  /**
   * Get all available region codes
   * @returns Array of all region codes
   */
  async getAllRegionCodes(): Promise<string[]> {
    await this.loadRegionCodes();
    return Object.keys(this.regionCodes);
  }

  /**
   * Check if a region code exists
   * @param code - Region code to check
   * @returns True if the code exists
   */
  async hasRegionCode(code: string): Promise<boolean> {
    await this.loadRegionCodes();
    return code in this.regionCodes;
  }

  // Subdivision mapping for regions without GeoJSON files
  private readonly subdivisionMapping: { [key: string]: string[] } = {
    // Borneo - shared between Indonesia and Malaysia
    'BOR': ['IDN', 'MLY'],
    
    // Indonesia islands
    'JAW': ['IDN'], // Java
    'SUM': ['IDN'], // Sumatra
    'SUL': ['IDN'], // Sulawesi
    'MOL': ['IDN'], // Moluccas
    'LSI': ['IDN'], // Lesser Sunda Islands
    
    // Argentina regions
    'AGE': ['ARG'], // Argentina East
    'AGW': ['ARG'], // Argentina West
    
    // China regions  
    'CHC': ['CHN'], // China Central
    'CHH': ['CHN'], // China South Central
    'CHS': ['CHN'], // China South
    'CHT': ['CHN'], // China Tibet
    
    // Brazil regions
    'BZC': ['BRA'], // Brazil Central
    'BZE': ['BRA'], // Brazil East
    'BZL': ['BRA'], // Brazil Southeast
    'BZN': ['BRA'], // Brazil North
    'BZS': ['BRA'], // Brazil South
    
    // Mexico regions
    'MXC': ['MEX'], // Mexico Central
    'MXE': ['MEX'], // Mexico East
    'MXG': ['MEX'], // Mexico Gulf
    'MXI': ['MEX'], // Mexico Islands
    'MXN': ['MEX'], // Mexico North
    'MXS': ['MEX'], // Mexico South
    'MXT': ['MEX'], // Mexico Southeast
    
    // Venezuela regions
    'VNA': ['VEN'], // Venezuela Antilles
    
    // Cape Verde regions  
    'CVI': ['CPV'], // Cape Verde Islands
    
    // New Zealand regions
    'NZN': ['NZL'], // New Zealand North
    'NZS': ['NZL'], // New Zealand South
    
    // Christmas Island regions
    'XMS': ['AUS'], // Christmas Island (Australian territory)
    
    // Caroline Islands regions
    'CRL': ['FSM'], // Caroline Islands
    
    // Papua New Guinea regions
    'NWG': ['PNG'], // New Guinea
    'BIS': ['PNG'], // Bismarck Archipelago
  };

  private readonly subdivisionNames: { [key: string]: string } = {
    'BOR': 'Borneo region',
    'JAW': 'Java island',
    'SUM': 'Sumatra island', 
    'SUL': 'Sulawesi island',
    'MOL': 'Moluccas islands',
    'LSI': 'Lesser Sunda islands',
    'AGE': 'East region',
    'AGW': 'West region',
    'CHC': 'Central region',
    'CHH': 'South Central region', 
    'CHS': 'South region',
    'CHT': 'Tibet region',
    'BZC': 'Central region',
    'BZE': 'East region',
    'BZL': 'Southeast region',
    'BZN': 'North region',
    'BZS': 'South region',
    'MXC': 'Central region',
    'MXE': 'East region',
    'MXG': 'Gulf region',
    'MXI': 'Islands region',
    'MXN': 'North region',
    'MXS': 'South region',
    'MXT': 'Southeast region',
    'VNA': 'Antilles region',
    'CVI': 'Cape Verde Islands',
    'NZN': 'North Island',
    'NZS': 'South Island', 
    'XMS': 'Christmas Island',
    'CRL': 'Caroline Islands',
    'NWG': 'New Guinea region',
    'BIS': 'Bismarck Islands',
  };

  /**
   * Get parent country codes for a subdivision region
   * @param subdivisionCode - Subdivision region code (e.g., "BOR", "JAW")
   * @returns Array of parent country codes or empty array if not a subdivision
   */
  getParentCountries(subdivisionCode: string): string[] {
    return this.subdivisionMapping[subdivisionCode] || [];
  }

  /**
   * Get subdivision name for display
   * @param subdivisionCode - Subdivision region code
   * @returns Human-readable subdivision name
   */
  getSubdivisionName(subdivisionCode: string): string {
    return this.subdivisionNames[subdivisionCode] || subdivisionCode;
  }

  /**
   * Check if a region code is a subdivision (no direct GeoJSON)
   * @param code - Region code to check
   * @returns True if it's a subdivision region
   */
  isSubdivision(code: string): boolean {
    return code in this.subdivisionMapping;
  }

  /**
   * Convert subdivision codes to display text with parent countries
   * @param codes - Comma-separated region codes
   * @param includeFlags - Whether to include flag images
   * @returns Promise<string> - HTML string with proper subdivision handling
   */
  async convertSubdivisionCodesToDisplay(codes: string, includeFlags: boolean = true): Promise<string> {
    await this.loadRegionCodes();

    if (!codes || codes.trim() === '') {
      return '';
    }

    const codeList = codes.split(',').map(code => code.trim());
    const results: string[] = [];

    for (const code of codeList) {
      if (this.isSubdivision(code)) {
        // Handle subdivision - show each parent country separately
        const parentCountries = this.getParentCountries(code);
        const subdivisionName = this.getSubdivisionName(code);
        
        for (const parentCode of parentCountries) {
          const parentData = this.regionCodes[parentCode];
          if (parentData) {
            if (includeFlags && parentData.flag) {
              const flagImg = `<img src="${parentData.flag}" class="flag-img" alt="${parentData.name} flag">`;
              results.push(`${flagImg} ${parentData.name} (${subdivisionName})`);
            } else {
              results.push(`${parentData.name} (${subdivisionName})`);
            }
          } else {
            results.push(`${parentCode} (${subdivisionName})`);
          }
        }
      } else {
        // Handle regular region code
        const regionData = this.regionCodes[code];
        if (regionData) {
          if (includeFlags && regionData.flag) {
            const flagImg = `<img src="${regionData.flag}" class="flag-img" alt="${regionData.name} flag">`;
            results.push(`${flagImg} ${regionData.name}`);
          } else {
            results.push(regionData.name);
          }
        } else {
          console.warn(`Unknown region code: ${code}`);
          results.push(code);
        }
      }
    }

    return results.join(', ');
  }

  /**
   * Convert subdivision codes to display text with parent countries (LIMITED)
   * @param codes - Comma-separated region codes
   * @param includeFlags - Whether to include flag images
   * @param maxCount - Maximum number of regions to display
   * @returns Promise<string> - HTML string with proper subdivision handling
   */
  async convertSubdivisionCodesToDisplayLimited(codes: string, includeFlags: boolean = true, maxCount: number = 5): Promise<string> {
    await this.loadRegionCodes();

    if (!codes || codes.trim() === '') {
      return '';
    }

    const codeList = codes.split(',').map(code => code.trim());
    const results: string[] = [];

    // Process only the first codes up to maxCount, but count subdivisions as multiple entries
    let processedCount = 0;
    
    for (const code of codeList) {
      if (processedCount >= maxCount) break;
      
      if (this.isSubdivision(code)) {
        // Handle subdivision - show each parent country separately
        const parentCountries = this.getParentCountries(code);
        const subdivisionName = this.getSubdivisionName(code);
        
        for (const parentCode of parentCountries) {
          if (processedCount >= maxCount) break;
          
          const parentData = this.regionCodes[parentCode];
          if (parentData) {
            if (includeFlags && parentData.flag) {
              const flagImg = `<img src="${parentData.flag}" class="flag-img" alt="${parentData.name} flag">`;
              results.push(`<div class="region-item">${flagImg} ${parentData.name} (${subdivisionName})</div>`);
            } else {
              results.push(`<div class="region-item">${parentData.name} (${subdivisionName})</div>`);
            }
          } else {
            results.push(`<div class="region-item">${parentCode} (${subdivisionName})</div>`);
          }
          processedCount++;
        }
      } else {
        // Handle regular region code
        const regionData = this.regionCodes[code];
        if (regionData) {
          if (includeFlags && regionData.flag) {
            const flagImg = `<img src="${regionData.flag}" class="flag-img" alt="${regionData.name} flag">`;
            results.push(`<div class="region-item">${flagImg} ${regionData.name}</div>`);
          } else {
            results.push(`<div class="region-item">${regionData.name}</div>`);
          }
        } else {
          console.warn(`Unknown region code: ${code}`);
          results.push(`<div class="region-item">${code}</div>`);
        }
        processedCount++;
      }
    }

    let output = `<div class="region-list">${results.join('')}</div>`;

    // Add "and X more" message if there are more regions
    const totalOriginalCodes = codeList.length;
    if (processedCount < totalOriginalCodes) {
      const remainingCount = totalOriginalCodes - processedCount;
      output += `<div class="region-more">and ${remainingCount} more</div>`;
    }

    return output;
  }
}