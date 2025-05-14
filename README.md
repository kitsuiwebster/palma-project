# Palma-1.0 Dataset

## Comprehensive Database of Global Palm Species

Palma-1.0 is a comprehensive exploration of palm species, including the PalmTraits 1.0 dataset enriched with data from GBIF, iNaturalist, Wikimedia Commons, and Plants of the World Online (POWO).

---

## Dataset Overview

Palma-1.0 contains comprehensive data on over 2,500 palm species across 181 genera. The dataset combines morphological traits, taxonomic classification, geographic distribution, and detailed fruit characteristics, enhanced with information from multiple authoritative sources.

### Key Statistics

- **2,500+ Species** - Comprehensive coverage of palm biodiversity
- **181 Genera** - Representing the taxonomic breadth of the Arecaceae family
- **120+ Countries** - Global distribution across tropical and subtropical regions
- **45+ Variables** - Covering taxonomy, morphology, geography, and fruit characteristics

---

## Dataset Structure

The dataset is organized into several major categories of variables:

### 1. Taxonomy

| Variable | Description | Example |
|----------|-------------|---------|
| SpecName | Complete scientific name of the species | Acanthophoenix crinita |
| accGenus | Taxonomic genus | Acanthophoenix |
| accSpecies | Species epithet | crinita |
| PalmTribe | Taxonomic tribe | Areceae |
| PalmSubfamily | Subfamily within Arecaceae | Arecoideae |

### 2. Native Zone & Common Names

| Variable | Description | Example |
|----------|-------------|---------|
| NativeRegion | Primary native geographic region | EC. & SE. Réunion |
| CommonNamesEN | Common names in English | Everglades palm, paurotis palm |
| CommonNamesFR | Common names in French | Palmiste rouge, Palmiste boure |
| CommonNamesSP | Common names in Spanish | tasiste |
| Photos | URLs to species photographs | [URL links to images] |
| PhotoReferences | Attribution for photographs | (c) Aurélien Bour, some rights reserved (CC BY-NC) |

### 3. Growth & Habit

| Variable | Description | Example |
|----------|-------------|---------|
| Climbing | Climbing growth habit (0/1) | 0 |
| Acaulescent | Without an above-ground stem (0/1) | 0 |
| Erect | Upright growth pattern (0/1) | 1 |
| StemSolitary | Single stem vs. clustering (0/1) | 1 |
| StemArmed | Presence of spines on stem (0/1) | 1 |
| MaxStemHeight_m | Maximum height (m) | 15 |
| MaxStemDia_cm | Maximum stem diameter (cm) | 20 |
| UnderstoreyCanopy | Growth position in forest structure | canopy |

### 4. Leaf Characteristics

| Variable | Description | Example |
|----------|-------------|---------|
| LeavesArmed | Presence of spines on leaves (0/1) | 1 |
| MaxLeafNumber | Maximum number of leaves | 15 |
| Max_Blade_Length_m | Maximum leaf blade length (m) | 2.3 |
| Max_Rachis_Length_m | Maximum rachis length (m) | 3 |
| Max_Petiole_length_m | Maximum petiole length (m) | 0.65 |

### 5. Fruit Characteristics

| Variable | Description | Example |
|----------|-------------|---------|
| AverageFruitLength_cm | Average fruit length (cm) | 0.65 |
| MinFruitLength_cm | Minimum fruit length (cm) | 0.6 |
| MaxFruitLength_cm | Maximum fruit length (cm) | 0.7 |
| AverageFruitWidth_cm | Average fruit width (cm) | 0.5 |
| MinFruitWidth_cm | Minimum fruit width (cm) | 0.5 |
| MaxFruitWidth_cm | Maximum fruit width (cm) | 0.9 |
| FruitSizeCategorical | Categorical fruit size | small |
| FruitShape | Fruit shape description | ovoid |
| FruitColorDescription | Detailed description of fruit colors | black |
| MainFruitColors | Dominant colors of ripe fruit | black |
| Conspicuousness | Visibility of the fruit | cryptic |

---

## Data Sources

### Primary Dataset
- **PalmTraits 1.0**: The foundational dataset containing morphological and ecological data for palm species worldwide.

### Enrichment Sources
1. **GBIF (Global Biodiversity Information Facility)**
   - Over 1.8 million palm observations
   - Provides occurrence data and taxonomic information

2. **iNaturalist**
   - Over 250,000 palm observations
   - Citizen science platform with photo documentation

3. **POWO (Plants of the World Online)**
   - Definitive source for accepted taxonomy
   - Maintained by the Royal Botanic Gardens, Kew

4. **Wikimedia Commons**
   - Repository of CC-licensed palm images
   - Used for visual documentation of species

---

## Methodology

The dataset was developed through the following process:

1. **Data Collection**
   - Primary data extracted from PalmTraits 1.0
   - Enriched with API queries to GBIF, iNaturalist, and POWO

2. **Taxonomic Harmonization**
   - Reference taxonomy from POWO used as standard
   - Resolution of synonymies and taxonomic inconsistencies

3. **Validation and Cleaning**
   - Rigorous validation to identify and correct outliers
   - Manual verification of inconsistent records using scientific literature

4. **Geospatial Enrichment**
   - Addition of environmental information from global geospatial layers
   - Characterization of ecological niches

5. **Analysis and Visualization**
   - Statistical methods applied to explore patterns
   - Visualization of distribution and trait relationships

---

### Available Formats

The dataset is available in multiple formats:
- CSV (comma-separated values)
- JSON (JavaScript Object Notation)
- Plain text

All available for download from the [Palma Encyclopedia Website](https://palma-encyclopedia.com/data) in the `Dataset` section, or directly onthis repository.

---

## Citation

If you use this dataset in your research, please cite:

```
PalmTraits 1.0: A global database of palm functional traits, based on PalmTraits 1.0 and enhanced with GBIF, 
iNaturalist and POWO data (2025). Encyclopedia of Palms Project.
```

---

## License

This dataset is made available under the Creative Commons Attribution-NonCommercial 4.0 International License ([CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)).

---

## Contributors

- [ Raphaël MARTIN ](https://kitsuiwebster.com)

---

## Contact

For questions, suggestions, or collaboration inquiries, please open an issue in this repository or contact:

Email: contact@kitsuiwebster.com
Twitter: [@kitsuiwebster](https://x.com/kitsuiwebster)