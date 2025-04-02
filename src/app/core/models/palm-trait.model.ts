// src/app/core/models/palm-trait.model.ts
export interface PalmTrait {
  id?: string; // Ajouté comme optionnel car il ne semble pas être dans votre dataset

  // Données de base présentes dans le dataset
  SpecName: string;
  accGenus: string;
  accSpecies: string;
  PalmTribe: string;
  PalmSubfamily: string;

  // Caractéristiques physiques
  Climbing: number;
  Acaulescent: number;
  Erect: number;
  StemSolitary: number;
  StemArmed: number;
  LeavesArmed: number;
  MaxStemHeight_m: number;
  MaxStemDia_cm: number;
  UnderstoreyCanopy: string;
  MaxLeafNumber: number;
  Max_Blade_Length_m: number;
  Max_Rachis_Length_m: number;
  Max_Petiole_length_m: number;

  // Caractéristiques des fruits
  AverageFruitLength_cm: number;
  MinFruitLength_cm: number;
  MaxFruitLength_cm: number;
  AverageFruitWidth_cm: number;
  MinFruitWidth_cm: number;
  MaxFruitWidth_cm: number;
  FruitSizeCategorical: string;
  FruitShape: string;
  FruitColorDescription: string;
  MainFruitColors: string;
  Conspicuousness: string;

  // Propriétés complémentaires utilisées dans l'interface
  // Ces propriétés seront calculées à partir des données du dataset
  image_url?: string;
  conservation_status?: string;
  distribution?: string;
  habitat?: string;

  // Accesseurs simplifiés
  genus?: string; // Alias pour accGenus
  species?: string; // Alias pour SpecName
  tribe?: string; // Alias pour PalmTribe
  height_max_m?: number; // Alias pour MaxStemHeight_m

  description?: string;
}
