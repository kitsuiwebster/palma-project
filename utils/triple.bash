#!/bin/bash

# Configuration
INPUT_FILE="dataset.txt"
OUTPUT_FILE="done.txt"
DELAY_POWO=3
DELAY_GBIF=3
DELAY_INAT=3

echo "🌴 Starting Palm Data Enrichment Script..."
echo "👉 Input file: $INPUT_FILE"
echo "👉 Output file: $OUTPUT_FILE"

# Créer un en-tête simple
echo -e "SpecName\taccGenus\taccSpecies\tPalmTribe\tPalmSubfamily\tNativeRegion\tCommonNamesFR\tCommonNamesSP\tCommonNamesEN\tPhotos\tPhotoReferences\tClimbing\tAcaulescent\tErect\tStemSolitary\tStemArmed\tLeavesArmed\tMaxStemHeight_m\tMaxStemDia_cm\tUnderstoreyCanopy\tMaxLeafNumber\tMax_Blade_Length_m\tMax_Rachis_Length_m\tMax_Petiole_length_m\tAverageFruitLength_cm\tMinFruitLength_cm\tMaxFruitLength_cm\tAverageFruitWidth_cm\tMinFruitWidth_cm\tMaxFruitWidth_cm\tFruitSizeCategorical\tFruitShape\tFruitColorDescription\tMainFruitColors\tConspicuousness" > "$OUTPUT_FILE"

# Traiter chaque ligne
total_lines=$(tail -n +2 "$INPUT_FILE" | wc -l)
echo "👉 Total species to process: $total_lines"

counter=0
tail -n +2 "$INPUT_FILE" | while IFS=$'\t' read -r line; do
  counter=$((counter + 1))
  echo "🔍 Processing species $counter/$total_lines"
  
  # Extract Genus and Species
  genus=$(echo "$line" | cut -f2)
  species=$(echo "$line" | cut -f3)
  fullname="$genus $species"
  
  echo "🌱 Working with: $fullname"
  
  # Get native region
  encoded_name_powo=$(echo "$fullname" | sed 's/ /%20/g')
  fqid=$(curl -s "https://powo.science.kew.org/api/2/search?q=${encoded_name_powo}" | jq -r '.results[] | select(.accepted==true) | .fqId' | head -n1)
  
  native="Unknown Native Region"
  if [ -n "$fqid" ]; then
    json=$(curl -s "https://powo.science.kew.org/api/2/taxon/${fqid}")
    native=$(echo "$json" | jq -r '.taxonRemarks // empty')
    native=${native:-"Unknown Native Region"}
  fi
  sleep "$DELAY_POWO"
  
  # Get common names
  encoded_name_gbif=$(echo "$fullname" | sed 's/ /+/g')
  taxon_key=$(curl -s "https://api.gbif.org/v1/species?name=${encoded_name_gbif}" | jq -r '.results[0].key' 2>/dev/null)
  
  name_fr="Pas de nom commun"
  name_es="Sin nombre común"
  name_en="No Common Name"
  
  if [ -n "$taxon_key" ] && [ "$taxon_key" != "null" ]; then
    vernacular_response=$(curl -s "https://api.gbif.org/v1/species/${taxon_key}/vernacularNames")
    name_fr=$(echo "$vernacular_response" | jq -r '.results[] | select(.language == "fra") | .vernacularName' 2>/dev/null | sort | uniq | paste -sd ", " -)
    name_es=$(echo "$vernacular_response" | jq -r '.results[] | select(.language == "spa" or .language == "esp") | .vernacularName' 2>/dev/null | sort | uniq | paste -sd ", " -)
    name_en=$(echo "$vernacular_response" | jq -r '.results[] | select(.language == "eng") | .vernacularName' 2>/dev/null | sort | uniq | paste -sd ", " -)
    name_fr=${name_fr:-"Pas de nom commun"}
    name_es=${name_es:-"Sin nombre común"}
    name_en=${name_en:-"No Common Name"}
  fi
  sleep "$DELAY_GBIF"
  
  # Get photos
  encoded_name_inat=$(echo "$fullname" | sed 's/ /%20/g')
  id=$(curl -s "https://api.inaturalist.org/v1/search?q=${encoded_name_inat}&sources=taxa" | jq -r '.results[] | select(.record.rank == "species") | .record.id' | head -n1)
  
  photos="NoImages"
  references="NoReferences"
  
  if [ -n "$id" ]; then
    response=$(curl -s "https://api.inaturalist.org/v1/taxa/$id")
    photos=$(echo "$response" | jq -r '.results[0].taxon_photos[] | .photo.large_url' | paste -sd " " -)
    references=$(echo "$response" | jq -r '.results[0].taxon_photos[] | .photo.attribution' | paste -sd " " -)
    photos=${photos:-"NoImages"}
    references=${references:-"NoReferences"}
  fi
  sleep "$DELAY_INAT"
  
  # Extraire les 5 premières colonnes
  col1=$(echo "$line" | cut -f1)
  col2=$(echo "$line" | cut -f2)
  col3=$(echo "$line" | cut -f3)
  col4=$(echo "$line" | cut -f4)
  col5=$(echo "$line" | cut -f5)
  
  # Extraire les colonnes restantes (après PalmSubfamily)
  remaining=$(echo "$line" | cut -f6-)
  
  # Construire la nouvelle ligne manuellement (sans sed ou awk)
  processed_line="${col1}\t${col2}\t${col3}\t${col4}\t${col5}\t${native}\t${name_fr}\t${name_es}\t${name_en}\t${photos}\t${references}\t${remaining}"
  
  echo -e "$processed_line" >> "$OUTPUT_FILE"
  echo "  ✓ Species $counter processed"
  echo "--------------------------------------------"
done

echo "✅ All done! Enriched palm data saved to $OUTPUT_FILE."