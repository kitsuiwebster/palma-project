import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, catchError, shareReplay, switchMap, forkJoin } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FlagService {
  private cache = new Map<string, Observable<string>>();

  private manualMap: {[key: string]: string} = {
    'Réunion': 'https://flagcdn.com/w20/re.png',
    'Mauritius': 'https://flagcdn.com/w20/mu.png',
    'Cuba': 'https://flagcdn.com/w20/cu.png',
    'Brazil': 'https://flagcdn.com/w20/br.png',
    'Mexico': 'https://flagcdn.com/w20/mx.png',
    'Colombia': 'https://flagcdn.com/w20/co.png',
    'Ecuador': 'https://flagcdn.com/w20/ec.png',
    'Peru': 'https://flagcdn.com/w20/pe.png',
    'Paraguay': 'https://flagcdn.com/w20/py.png',
    'Argentina': 'https://flagcdn.com/w20/ar.png',
    'Trinidad': 'https://flagcdn.com/w20/tt.png',
    'Barbados': 'https://flagcdn.com/w20/bb.png',
    'Philippines': 'https://flagcdn.com/w20/ph.png',
    'New Caledonia': 'https://flagcdn.com/w20/nc.png',
    'Papuasia': 'https://flagcdn.com/w20/pg.png',
    'Australia': 'https://flagcdn.com/w20/au.png',
    'French Guiana': 'https://flagcdn.com/w20/gf.png',
    'Comoros': 'https://flagcdn.com/w20/km.png',
    'Hispaniola': 'https://flagcdn.com/w20/do.png',
    'Caribbean': '',
    'Unknown Native Region': '',
  };

  constructor(private http: HttpClient) {}

  getFlagUrl(regionName: string): Observable<string> {
    // Split on commas first to get major parts
    const majorParts = regionName.split(',').map(part => part.trim());
    
    // For each major part, extract potential country names
    const countryParts: string[] = [];
    for (const part of majorParts) {
      // If contains "to", prioritize what comes after "to"
      if (part.includes(' to ')) {
        const afterTo = part.split(' to ').pop()!.trim();
        countryParts.push(afterTo);
        // Also add what comes before "to" as fallback
        countryParts.push(part.split(' to ')[0].trim());
      }
      // If contains "and", add both parts
      else if (part.includes(' and ')) {
        const andParts = part.split(' and ').map(p => p.trim());
        countryParts.push(...andParts);
      }
      // If contains "&", add both parts
      else if (part.includes(' & ')) {
        const ampParts = part.split(' & ').map(p => p.trim());
        countryParts.push(...ampParts);
      }
      // Otherwise add the whole part
      else {
        countryParts.push(part);
      }
    }

    // Clean each part and remove duplicates
    const cleanedParts = [...new Set(
      countryParts
        .map(part => this.cleanRegionName(part.replace(/\([^)]*\)/g, '').trim()))
        .filter(part => part.length > 0)
    )];

    // Try each cleaned part
    const observables = cleanedParts.map(part => this.getFlagForPart(part));
    return forkJoin(observables).pipe(
      map(results => results.find(url => !!url) || '')
    );
  }

  private getFlagForPart(cleaned: string): Observable<string> {
    const key = cleaned.toLowerCase();

    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const manualFlag = this.getManualFlag(cleaned);
    if (manualFlag) {
      const obs = of(manualFlag).pipe(shareReplay(1));
      this.cache.set(key, obs);
      return obs;
    }

    const request$ = this.queryApi(cleaned).pipe(
      switchMap(flagUrl => {
        if (flagUrl) return of(flagUrl);
        const firstWord = cleaned.split(/[ ,;-]+/)[0];
        if (firstWord && firstWord.toLowerCase() !== key) {
          return this.queryApi(firstWord);
        }
        return of('');
      }),
      map(flagUrl => flagUrl || manualFlag || ''),
      catchError(() => of('')),
      shareReplay(1)
    );

    this.cache.set(key, request$);
    return request$;
  }

  private cleanRegionName(region: string): string {
    let r = region.trim();
    const prefixes = [
      'Pen.', 'N.', 'E.', 'W.', 'S.', 'NE.', 'NW.', 'SE.', 'SW.', 'C.', 'EC.', 'WC.', 'SC.', 'NC.',
      'Central', 'Eastern', 'Western', 'Northern', 'Southern'
    ];
    prefixes.forEach(prefix => {
      if (r.startsWith(prefix)) {
        r = r.substring(prefix.length).trim();
      }
    });
    return r;
  }

  private queryApi(name: string): Observable<string> {
    return this.http
      .get<any[]>(`https://restcountries.com/v3.1/name/${encodeURIComponent(name)}?fullText=false`)
      .pipe(
        map((countries) => {
          if (countries && countries.length > 0 && countries[0].flags && countries[0].flags.png) {
            return countries[0].flags.png;
          }
          return '';
        }),
        catchError(() => of(''))
      );
  }

  public getManualFlag(regionName: string): string {
    for (const key in this.manualMap) {
      if (regionName.includes(key)) {
        return this.manualMap[key];
      }
    }
    return '';
  }
}