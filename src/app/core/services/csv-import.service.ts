// src/app/core/services/csv-import.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { PalmTrait } from '../models/palm-trait.model';

@Injectable({
  providedIn: 'root'
})
export class CsvImportService {
  constructor(private http: HttpClient) {}

  /**
   * Importe un fichier CSV depuis les assets
   * @param filePath Chemin vers le fichier CSV dans les assets
   * @returns Un Observable avec les données parsées
   */
  importCsvFromAssets(filePath: string): Observable<PalmTrait[]> {
    return this.http.get(filePath, { responseType: 'text' }).pipe(
      map(csv => this.parseCsvToArray(csv))
    );
  }

  /**
   * Parse une chaîne CSV en un tableau d'objets
   * @param csv Données CSV sous forme de chaîne
   * @returns Tableau d'objets PalmTrait
   */
  private parseCsvToArray(csv: string): PalmTrait[] {
    // Diviser par lignes
    const lines = csv.split('\n');
    
    // La première ligne contient les en-têtes
    const headers = lines[0].split(',').map(header => header.trim());
    
    // Convertir les lignes restantes en objets
    const result: PalmTrait[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      // Ignorer les lignes vides
      if (!lines[i].trim()) continue;
      
      const currentLine = lines[i].split(',');
      const obj: any = {};
      
      // Mapper les valeurs aux en-têtes
      for (let j = 0; j < headers.length; j++) {
        const value = currentLine[j]?.trim();
        
        // Convertir les valeurs numériques si possible
        if (value && !isNaN(Number(value))) {
          obj[headers[j]] = Number(value);
        } else {
          obj[headers[j]] = value || null;
        }
      }
      
      // Ajouter des propriétés dérivées pour la compatibilité avec l'interface
      result.push({
        ...obj,
        // Ces propriétés seront utilisées par le composant card
        id: String(i), // ID généré
        genus: obj.accGenus,
        species: obj.SpecName,
        tribe: obj.PalmTribe,
        height_max_m: obj.MaxStemHeight_m,
        distribution: this.generateDistribution(obj),
        habitat: obj.UnderstoreyCanopy || 'Unknown',
        image_url: `assets/images/palms/${this.slugify(obj.SpecName)}.jpg`,
        conservation_status: this.determineConservationStatus(obj)
      });
    }
    
    return result;
  }
  
  /**
   * Génère une description de la distribution géographique (exemple simpliste)
   */
  private generateDistribution(palm: any): string {
    // Ici, vous pourriez avoir une logique plus complexe basée sur d'autres données
    return 'Global distribution';
  }
  
  /**
   * Détermine un statut de conservation basé sur d'autres attributs
   */
  private determineConservationStatus(palm: any): string {
    // Logique d'exemple - pourrait être basée sur d'autres attributs
    return 'Status unknown';
  }
  
  /**
   * Convertit un texte en format slug pour les URLs
   */
  private slugify(text: string): string {
    if (!text) return '';
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