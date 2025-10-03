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
}