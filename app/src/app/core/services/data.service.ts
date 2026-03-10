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
    // Si les données sont déjà en cache, retourner le cache
    if (this.cachedPalms) {
      return of(this.cachedPalms);
    }

    // Sinon, charger depuis le fichier texte local
    return this.http.get(this.dataFilePath, { responseType: 'text' }).pipe(
      map((textData) => this.parseTextData(textData)),
      map((palms) => palms.map((palm) => this.processPalmData(palm))),
      tap((processedPalms) => {
        this.cachedPalms = processedPalms;
      }),
      catchError((error) => {
        return of([]);
      })
    );
  }

  // Fonction pour rechercher des palmiers par terme
searchPalms(term: string, limit: number | null = 30): Observable<PalmTrait[]> {
  return this.getAllPalms().pipe(
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
    // Diviser par lignes
    const lines = textData.split('\n');

    if (lines.length === 0) {
      return [];
    }

    // La première ligne contient les en-têtes
    const firstLine = lines[0];

    // Déterminer le délimiteur utilisé
    const delimiter = firstLine.includes('\t') ? '\t' : ' ';

    const headers = firstLine.split(delimiter).map((header) => header.trim());

    const result: any[] = [];

    for (let i = 1; i < lines.length; i++) {

      // Ignorer les lignes vides
      if (!lines[i].trim()) continue;

      const currentLine = lines[i].split(delimiter);


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


  // Récupérer les espèces d'un genre par slug
  getPalmsByGenusSlug(genusSlug: string): Observable<PalmTrait[]> {
    return this.getAllPalms().pipe(
      map((palms) => {
        return palms.filter(
          (p) => this.slugify(p.accGenus || p.genus || '') === genusSlug
        );
      })
    );
  }

  // Récupérer la liste de tous les genres uniques
  getAllGenera(): Observable<{ name: string; slug: string; count: number }[]> {
    return this.getAllPalms().pipe(
      map((palms) => {
        const genusMap = new Map<string, number>();
        palms.forEach((p) => {
          const genus = p.accGenus || p.genus || 'Unknown';
          genusMap.set(genus, (genusMap.get(genus) || 0) + 1);
        });
        return Array.from(genusMap.entries())
          .map(([name, count]) => ({
            name,
            slug: this.slugify(name),
            count,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
      })
    );
  }

  // Récupérer les espèces d'une région par code
  getPalmsByRegionCode(regionCode: string): Observable<PalmTrait[]> {
    return this.getAllPalms().pipe(
      map((palms) => {
        const code = regionCode.toUpperCase();
        return palms.filter((p) => {
          const nativeRegion = p.NativeRegion || '';
          return new RegExp(`\\b${code}\\b`).test(nativeRegion);
        });
      })
    );
  }

  // Récupérer la liste de toutes les régions uniques avec nombre d'espèces
  getAllRegions(): Observable<{ code: string; count: number }[]> {
    return this.getAllPalms().pipe(
      map((palms) => {
        const regionMap = new Map<string, number>();
        palms.forEach((p) => {
          const nativeRegion = p.NativeRegion || '';
          const codes = nativeRegion.match(/\b[A-Z]{2,3}\b/g) || [];
          codes.forEach((code) => {
            regionMap.set(code, (regionMap.get(code) || 0) + 1);
          });
        });
        return Array.from(regionMap.entries())
          .map(([code, count]) => ({ code, count }))
          .sort((a, b) => b.count - a.count);
      })
    );
  }

  // ===== Characteristic-based filtering =====

  // Get palms by stem type (climbing, acaulescent, erect)
  getPalmsByStemType(stemType: string): Observable<PalmTrait[]> {
    return this.getAllPalms().pipe(
      map((palms) => {
        switch (stemType) {
          case 'climbing': return palms.filter(p => p.Climbing === 1);
          case 'acaulescent': return palms.filter(p => p.Acaulescent === 1);
          case 'erect': return palms.filter(p => p.Erect === 1);
          case 'solitary': return palms.filter(p => p.StemSolitary === 1);
          case 'armed': return palms.filter(p => p.StemArmed === 1);
          default: return [];
        }
      })
    );
  }

  // Get all stem types with counts
  getAllStemTypes(): Observable<{ slug: string; label: string; count: number }[]> {
    return this.getAllPalms().pipe(
      map((palms) => {
        const types = [
          { slug: 'climbing', label: 'Climbing Palms', field: 'Climbing' as keyof PalmTrait },
          { slug: 'acaulescent', label: 'Acaulescent Palms', field: 'Acaulescent' as keyof PalmTrait },
          { slug: 'erect', label: 'Erect Palms', field: 'Erect' as keyof PalmTrait },
          { slug: 'solitary', label: 'Solitary Palms', field: 'StemSolitary' as keyof PalmTrait },
          { slug: 'armed', label: 'Armed Stem Palms', field: 'StemArmed' as keyof PalmTrait },
        ];
        return types.map(t => ({
          slug: t.slug,
          label: t.label,
          count: palms.filter(p => p[t.field] === 1).length,
        })).filter(t => t.count > 0);
      })
    );
  }

  // Get palms by fruit shape
  getPalmsByFruitShape(shape: string): Observable<PalmTrait[]> {
    return this.getAllPalms().pipe(
      map((palms) => palms.filter(p =>
        p.FruitShape && p.FruitShape.toLowerCase() === shape.toLowerCase()
      ))
    );
  }

  // Get all fruit shapes with counts
  getAllFruitShapes(): Observable<{ slug: string; label: string; count: number }[]> {
    return this.getAllPalms().pipe(
      map((palms) => {
        const shapeMap = new Map<string, number>();
        palms.forEach(p => {
          if (p.FruitShape) {
            const shape = p.FruitShape.toLowerCase();
            shapeMap.set(shape, (shapeMap.get(shape) || 0) + 1);
          }
        });
        return Array.from(shapeMap.entries())
          .map(([shape, count]) => ({
            slug: shape,
            label: shape.charAt(0).toUpperCase() + shape.slice(1) + ' Fruit',
            count,
          }))
          .sort((a, b) => b.count - a.count);
      })
    );
  }

  // Get palms by main fruit color
  getPalmsByFruitColor(color: string): Observable<PalmTrait[]> {
    return this.getAllPalms().pipe(
      map((palms) => palms.filter(p => {
        if (!p.MainFruitColors) return false;
        const colors = p.MainFruitColors.toLowerCase().split(';');
        return colors.includes(color.toLowerCase());
      }))
    );
  }

  // Get all main fruit colors with counts
  getAllFruitColors(): Observable<{ slug: string; label: string; count: number }[]> {
    return this.getAllPalms().pipe(
      map((palms) => {
        const colorMap = new Map<string, number>();
        palms.forEach(p => {
          if (p.MainFruitColors) {
            const colors = p.MainFruitColors.toLowerCase().split(';');
            colors.forEach(c => {
              const color = c.trim();
              if (color) colorMap.set(color, (colorMap.get(color) || 0) + 1);
            });
          }
        });
        return Array.from(colorMap.entries())
          .map(([color, count]) => ({
            slug: color,
            label: color.charAt(0).toUpperCase() + color.slice(1) + ' Fruit',
            count,
          }))
          .sort((a, b) => b.count - a.count);
      })
    );
  }

  // Get palms by understorey/canopy habitat
  getPalmsByHabitat(habitat: string): Observable<PalmTrait[]> {
    return this.getAllPalms().pipe(
      map((palms) => palms.filter(p =>
        p.UnderstoreyCanopy && p.UnderstoreyCanopy.toLowerCase() === habitat.toLowerCase()
      ))
    );
  }

  // Get all habitats with counts
  getAllHabitats(): Observable<{ slug: string; label: string; count: number }[]> {
    return this.getAllPalms().pipe(
      map((palms) => {
        const habitatMap = new Map<string, number>();
        palms.forEach(p => {
          if (p.UnderstoreyCanopy) {
            habitatMap.set(p.UnderstoreyCanopy.toLowerCase(), (habitatMap.get(p.UnderstoreyCanopy.toLowerCase()) || 0) + 1);
          }
        });
        return Array.from(habitatMap.entries())
          .map(([habitat, count]) => ({
            slug: habitat,
            label: habitat.charAt(0).toUpperCase() + habitat.slice(1) + ' Palms',
            count,
          }))
          .sort((a, b) => b.count - a.count);
      })
    );
  }

  // ===== Height-based filtering =====

  getPalmsByHeightRange(range: string): Observable<PalmTrait[]> {
    return this.getAllPalms().pipe(
      map((palms) => {
        const heightRanges: { [key: string]: [number, number] } = {
          'small': [0, 5],
          'medium': [5, 15],
          'tall': [15, 30],
          'very-tall': [30, 200],
        };
        const [min, max] = heightRanges[range] || [0, 0];
        return palms.filter(p => {
          const h = p.MaxStemHeight_m || p.height_max_m;
          return h != null && h > min && h <= max;
        });
      })
    );
  }

  getAllHeightRanges(): Observable<{ slug: string; label: string; range: string; count: number }[]> {
    return this.getAllPalms().pipe(
      map((palms) => {
        const ranges = [
          { slug: 'small', label: 'Small Palms', range: '0 - 5 m', min: 0, max: 5 },
          { slug: 'medium', label: 'Medium Palms', range: '5 - 15 m', min: 5, max: 15 },
          { slug: 'tall', label: 'Tall Palms', range: '15 - 30 m', min: 15, max: 30 },
          { slug: 'very-tall', label: 'Very Tall Palms', range: '30+ m', min: 30, max: 200 },
        ];
        return ranges.map(r => ({
          slug: r.slug,
          label: r.label,
          range: r.range,
          count: palms.filter(p => {
            const h = p.MaxStemHeight_m || p.height_max_m;
            return h != null && h > r.min && h <= r.max;
          }).length,
        })).filter(r => r.count > 0);
      })
    );
  }

  // ===== Taxonomy-based filtering =====

  getPalmsBySubfamily(subfamily: string): Observable<PalmTrait[]> {
    return this.getAllPalms().pipe(
      map((palms) => palms.filter(p =>
        p.PalmSubfamily && this.slugify(p.PalmSubfamily) === subfamily
      ))
    );
  }

  getAllSubfamilies(): Observable<{ name: string; slug: string; count: number }[]> {
    return this.getAllPalms().pipe(
      map((palms) => {
        const map = new Map<string, number>();
        palms.forEach(p => {
          if (p.PalmSubfamily) {
            map.set(p.PalmSubfamily, (map.get(p.PalmSubfamily) || 0) + 1);
          }
        });
        return Array.from(map.entries())
          .map(([name, count]) => ({ name, slug: this.slugify(name), count }))
          .sort((a, b) => b.count - a.count);
      })
    );
  }

  getPalmsByTribe(tribe: string): Observable<PalmTrait[]> {
    return this.getAllPalms().pipe(
      map((palms) => palms.filter(p =>
        (p.PalmTribe || p.tribe) && this.slugify(p.PalmTribe || p.tribe || '') === tribe
      ))
    );
  }

  getAllTribes(): Observable<{ name: string; slug: string; subfamily: string; count: number }[]> {
    return this.getAllPalms().pipe(
      map((palms) => {
        const tribeMap = new Map<string, { subfamily: string; count: number }>();
        palms.forEach(p => {
          const tribe = p.PalmTribe || p.tribe;
          if (tribe && tribe !== 'Unknown') {
            const existing = tribeMap.get(tribe);
            if (existing) {
              existing.count++;
            } else {
              tribeMap.set(tribe, { subfamily: p.PalmSubfamily || '', count: 1 });
            }
          }
        });
        return Array.from(tribeMap.entries())
          .map(([name, data]) => ({
            name,
            slug: this.slugify(name),
            subfamily: data.subfamily,
            count: data.count,
          }))
          .sort((a, b) => b.count - a.count);
      })
    );
  }

  // Exposer slugify pour utilisation externe (sitemap, liens)
  toSlug(text: string): string {
    return this.slugify(text);
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
