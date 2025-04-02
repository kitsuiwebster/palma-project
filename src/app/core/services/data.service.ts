// src/app/core/services/data.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { PalmTrait } from '../models/palm-trait.model';



@Injectable({
  providedIn: 'root',
})
export class DataService {
  private dataFilePath = 'assets/data/PalmTraits_1.0.txt';
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
  // Méthode searchPalms corrigée pour DataService

searchPalms(term: string): Observable<PalmTrait[]> {
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
        
        return score;
      };

      // Filtrer les palmiers et ne retenir que ceux avec un score > 0
      const results = palms
        .map(palm => ({
          palm,
          score: getScore(palm)
        }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score) // Tri par score décroissant
        .map(item => item.palm)
        .slice(0, 30); 
      
      console.log(`Found ${results.length} results for "${term}"`);
      if (results.length > 0) {
        console.log('First few results:', results.slice(0, 3).map(p => p.genus + ' ' + p.species));
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
      conservation_status: this.getConservationStatus(palm),
    };
  }

  // Méthodes pour calculer les valeurs manquantes
  private getDistribution(palm: any): string {
    // Vous pouvez personnaliser ceci avec des informations réelles
    if (palm.SpecName) {
      return `Native regions of ${palm.SpecName}`;
    }
    return 'Distribution information not available';
  }

  private getHabitat(palm: any): string {
    if (palm.UnderstoreyCanopy) {
      return palm.UnderstoreyCanopy === 'understorey'
        ? 'Forest understory'
        : 'Forest canopy';
    }
    if (palm.Conspicuousness) {
      return palm.Conspicuousness === 'conspicuous'
        ? 'Open habitat'
        : 'Hidden habitat';
    }
    return 'Habitat information not available';
  }

  private getImageUrl(palm: any): string {
    // Générer une URL d'image basée sur le nom d'espèce
    const speciesSlug = this.slugify(palm.SpecName || '');
    // Chemin vers l'image
    return `assets/images/palms/${speciesSlug}.jpg`;
  }

  private getConservationStatus(palm: any): string {
    // Logique basée sur les propriétés disponibles dans vos données
    if (palm.Conspicuousness === 'cryptic') {
      return 'Rare';
    }
    return 'Common';
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
