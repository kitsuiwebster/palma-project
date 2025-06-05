// src/app/core/services/data.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { PalmTrait } from '../models/palm-trait.model';



@Injectable({
  providedIn: 'root',
})
export class DataService {
  private dataFilePath = 'assets/data/dataset.txt';
  private cachedPalms: PalmTrait[] | null = null;

  constructor(private http: HttpClient) {}

  getAllPalms(): Observable<PalmTrait[]> {
    console.log('getAllPalms called');
    // Si les données sont déjà en cache, retourner le cache
    if (this.cachedPalms) {
      console.log('Returning cached data:', this.cachedPalms.length, 'palms');
      return of(this.cachedPalms);
    }

    // Sinon, charger depuis le fichier texte local
    console.log('Loading data from text file:', this.dataFilePath);
    return this.http.get(this.dataFilePath, { responseType: 'text' }).pipe(
      tap((textData) =>
        console.log(
          'Raw data received, length:',
          textData.length,
          'Preview:',
          textData.substring(0, 100)
        )
      ),
      map((textData) => this.parseTextData(textData)),
      tap((parsedData) =>
        console.log('Data parsed:', parsedData.length, 'items')
      ),
      map((palms) => palms.map((palm) => this.processPalmData(palm))),
      tap((processedPalms) => {
        console.log('Data processed:', processedPalms.length, 'palms');
        this.cachedPalms = processedPalms;
      }),
      catchError((error) => {
        console.error('ERROR LOADING DATA:', error);
        if (error.status) {
          console.error('HTTP status:', error.status, error.statusText);
        }
        return of([]);
      })
    );
  }

  // Fonction pour rechercher des palmiers par terme
searchPalms(term: string, limit: number | null = 30): Observable<PalmTrait[]> {
  console.log('Searching palms with term:', term);
  
  return this.getAllPalms().pipe(
    tap(all => console.log(`Searching through ${all.length} total palms`)),
    map((palms) => {
      const searchTerm = term.toLowerCase().trim();
      
      // Fonction de score pour ordonner les résultats
      const getScore = (palm: PalmTrait): number => {
        let score = 0;
        
        // Correspondance exacte au début du genre
        if (palm.genus?.toLowerCase().startsWith(searchTerm)) {
          score += 100;
        }
        // Correspondance exacte au début de l'espèce
        else if (palm.species?.toLowerCase().startsWith(searchTerm)) {
          score += 90;
        }
        // Correspondance exacte au début du nom de genre accepté
        else if (palm.accGenus?.toLowerCase().startsWith(searchTerm)) {
          score += 100;
        }
        // Correspondance exacte au début du nom d'espèce accepté
        else if (palm.SpecName?.toLowerCase().startsWith(searchTerm)) {
          score += 90;
        }
        
        // Correspondance n'importe où dans le genre
        if (palm.genus?.toLowerCase().includes(searchTerm)) {
          score += 50;
        }
        // Correspondance n'importe où dans l'espèce
        else if (palm.species?.toLowerCase().includes(searchTerm)) {
          score += 40;
        }
        // Correspondance n'importe où dans le nom de genre accepté
        else if (palm.accGenus?.toLowerCase().includes(searchTerm)) {
          score += 50;
        }
        // Correspondance n'importe où dans le nom d'espèce accepté
        else if (palm.SpecName?.toLowerCase().includes(searchTerm)) {
          score += 40;
        }
        
        // Correspondance n'importe où dans tribu
        if (palm.tribe?.toLowerCase().includes(searchTerm) ||
            palm.PalmTribe?.toLowerCase().includes(searchTerm)) {
          score += 20;
        }
        
        // Correspondance n'importe où dans sous-famille
        if (palm.PalmSubfamily?.toLowerCase().includes(searchTerm)) {
          score += 10;
        }
        
        // NOUVELLE FONCTIONNALITÉ: Recherche dans les noms communs
        
        // Nom commun français
        if (palm.CommonNamesFR) {
          const commonNamesFR = palm.CommonNamesFR.toLowerCase();
          
          // Diviser les noms communs qui sont séparés par des virgules ou des espaces
          const frenchNames = commonNamesFR.split(/,\s*|\s+/);
          
          for (const name of frenchNames) {
            if (name.startsWith(searchTerm)) {
              score += 80; // Score élevé pour une correspondance exacte au début
              break;
            } else if (name.includes(searchTerm)) {
              score += 30; // Score moyen pour une correspondance partielle
              break;
            }
          }
          
          // Recherche globale dans la chaîne complète des noms communs
          if (commonNamesFR.includes(searchTerm)) {
            score += 20;
          }
        }
        
        // Nom commun espagnol
        if (palm.CommonNamesSP) {
          const commonNamesSP = palm.CommonNamesSP.toLowerCase();
          
          // Diviser les noms communs qui sont séparés par des virgules ou des espaces
          const spanishNames = commonNamesSP.split(/,\s*|\s+/);
          
          for (const name of spanishNames) {
            if (name.startsWith(searchTerm)) {
              score += 80;
              break;
            } else if (name.includes(searchTerm)) {
              score += 30;
              break;
            }
          }
          
          // Recherche globale dans la chaîne complète des noms communs
          if (commonNamesSP.includes(searchTerm)) {
            score += 20;
          }
        }
        
        // Nom commun anglais
        if (palm.CommonNamesEN) {
          const commonNamesEN = palm.CommonNamesEN.toLowerCase();
          
          // Diviser les noms communs qui sont séparés par des virgules ou des espaces
          const englishNames = commonNamesEN.split(/,\s*|\s+/);
          
          for (const name of englishNames) {
            if (name.startsWith(searchTerm)) {
              score += 80;
              break;
            } else if (name.includes(searchTerm)) {
              score += 30;
              break;
            }
          }
          
          // Recherche globale dans la chaîne complète des noms communs
          if (commonNamesEN.includes(searchTerm)) {
            score += 20;
          }
        }
        
        return score;
      };

      // Filtrer les palmiers et ne retenir que ceux avec un score > 0
      let results = palms
        .map(palm => ({
          palm,
          score: getScore(palm)
        }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score) // Tri par score décroissant
        .map(item => item.palm);
      
      console.log(`Found ${results.length} results for "${term}"`);
      if (results.length > 0) {
        console.log('First few results:', results.slice(0, 3).map(p => p.genus + ' ' + p.species));
      }
      
      // Limiter le nombre de résultats si demandé
      if (limit && results.length > limit) {
        results = results.slice(0, limit);
      }
      
      return results;
    })
  );
}

  // Fonction pour récupérer un palmier par son nom d'espèce exact
  getPalmBySpecies(speciesName: string): Observable<PalmTrait | null> {
    return this.getAllPalms().pipe(
      map((palms) => {
        const normalizedName = speciesName.toLowerCase().trim();
        const palm = palms.find((p) => {
          const palmSpecies = (p.SpecName || p.species || '')
            .toLowerCase()
            .trim();
          return palmSpecies === normalizedName;
        });
        return palm || null;
      })
    );
  }

  // Grouper les palmiers par genre
  getPalmsByGenus(): Observable<{ [genus: string]: PalmTrait[] }> {
    return this.getAllPalms().pipe(
      map((palms) => {
        // Regrouper les palmiers par genre (accGenus ou genus)
        return palms.reduce((acc, palm) => {
          const genus = palm.accGenus || palm.genus || 'Unknown';
          if (!acc[genus]) {
            acc[genus] = [];
          }
          acc[genus].push(palm);
          return acc;
        }, {} as { [genus: string]: PalmTrait[] });
      })
    );
  }

  // Récupérer un palmier par son slug URL
  getPalmBySlug(slug: string): Observable<PalmTrait | null> {
    // Si on a déjà les palmiers en cache
    if (this.cachedPalms) {
      const palm = this.cachedPalms.find(
        (p) => this.slugify(p.species || p.SpecName || '') === slug
      );
      return of(palm || null);
    }

    // Sinon, charger tous les palmiers puis filtrer
    return this.getAllPalms().pipe(
      map((palms) => {
        return (
          palms.find(
            (p) => this.slugify(p.species || p.SpecName || '') === slug
          ) || null
        );
      })
    );
  }

  // Dans DataService
getPaginatedPalms(page: number, pageSize: number = 20): Observable<PalmTrait[]> {
  console.log(`Getting palms for page ${page} with size ${pageSize}`);
  return this.getAllPalms().pipe(
    map((palms) => {
      // Assurer que pageSize est au moins 20
      const actualPageSize = Math.max(pageSize, 20);
      const startIndex = page * actualPageSize;
      return palms.slice(startIndex, startIndex + actualPageSize);
    })
  );
}

  // Méthode pour obtenir le nombre total de palmiers
  getTotalPalmsCount(): Observable<number> {
    return this.getAllPalms().pipe(map((palms) => palms.length));
  }

  // Parse le fichier texte en objets
  private parseTextData(textData: string): any[] {
    console.log('parseTextData started');

    // Diviser par lignes
    const lines = textData.split('\n');
    console.log('Number of lines:', lines.length);

    if (lines.length === 0) {
      console.error('No lines found in text data');
      return [];
    }

    // La première ligne contient les en-têtes
    const firstLine = lines[0];
    console.log('First line:', firstLine);

    // Déterminer le délimiteur utilisé
    const delimiter = firstLine.includes('\t') ? '\t' : ' ';
    console.log('Detected delimiter:', delimiter === '\t' ? 'TAB' : 'SPACE');

    const headers = firstLine.split(delimiter).map((header) => header.trim());
    console.log('Headers:', headers);

    const result: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (i === 1 || i === 2) {
        console.log(`Line ${i}:`, lines[i]);
      }

      // Ignorer les lignes vides
      if (!lines[i].trim()) continue;

      const currentLine = lines[i].split(delimiter);

      if (i === 1) {
        console.log('First data line split:', currentLine);
      }

      // Créer l'objet pour cette ligne
      const obj: any = {};

      // Mapper les valeurs aux en-têtes
      for (let j = 0; j < headers.length; j++) {
        if (j < currentLine.length) {
          const value = currentLine[j]?.trim();

          // Convertir les valeurs numériques si possible
          if (value && !isNaN(Number(value))) {
            obj[headers[j]] = Number(value);
          } else {
            obj[headers[j]] = value || null;
          }
        } else {
          obj[headers[j]] = null; // Valeur manquante
        }
      }

      result.push(obj);
    }

    console.log('Parsing complete, items:', result.length);
    return result;
  }

  // Fonction pour standardiser les données du palmier
  private processPalmData(palm: any): PalmTrait {
    // Enrichir les données avec des propriétés calculées
    return {
      ...palm, // Garder toutes les propriétés originales

      // Ajouter des propriétés calculées qui correspondent à ce que votre UI attend
      genus: palm.accGenus || 'Unknown',
      species: palm.SpecName || 'Unknown',
      tribe: palm.PalmTribe || 'Unknown',
      height_max_m: palm.MaxStemHeight_m || null,

      // Valeurs par défaut pour les attributs manquants
      distribution: this.getDistribution(palm),
      habitat: this.getHabitat(palm),
      image_url: this.getImageUrl(palm),
      native_region: this.getDistribution(palm),
    };
  }

  // Méthodes pour calculer les valeurs manquantes
  private getDistribution(palm: any): string {
    // Check if NativeRegion exists and is not null or empty
    if (palm.NativeRegion) {
      return palm.NativeRegion;
    }
    return 'Distribution information not available';
  }

  private getHabitat(palm: any): string {
    if (palm.UnderstoreyCanopy) {
      return palm.UnderstoreyCanopy === 'understorey'
        ? 'Forest understory'
        : 'Forest canopy';
    }
    return 'Habitat information not available';
  }

  private getImageUrl(palm: any): string {
    if (palm.Photos && typeof palm.Photos === 'string' && palm.Photos.trim() !== '') {
      const urls = palm.Photos.trim().split(/\s+/);
      if (urls.length > 0 && urls[0].startsWith('http')) {
        return urls[0];
      }
    }
    // Si aucune URL trouvée dans le dataset, retourner l'image "no image"
    return 'assets/images/no-image.png';
  }


  // Méthode utilitaire pour créer un slug à partir d'une chaîne
  private slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }
}
