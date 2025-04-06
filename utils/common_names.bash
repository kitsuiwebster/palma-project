#!/bin/bash

INPUT_FILE="with_images.txt"
OUTPUT_FILE="with_common_names.txt"
DELAY=3 # secondes entre les requêtes API pour éviter de surcharger l'API GBIF

echo "👉 Démarrage du script de récupération des noms communs..."
echo "👉 Fichier d'entrée: $INPUT_FILE"
echo "👉 Fichier de sortie: $OUTPUT_FILE"
echo "👉 Délai entre les appels API: $DELAY secondes"

# Compter le nombre total de lignes, en excluant l'en-tête
total_lines=$(($(wc -l < "$INPUT_FILE") - 1))
echo "👉 Nombre total de lignes à traiter: $total_lines"

# Écrire l'en-tête avec les nouvelles colonnes
echo "👉 Écriture de l'en-tête dans $OUTPUT_FILE..."
head -n1 "$INPUT_FILE" | awk -v OFS="\t" '{ print $0, "CommonNamesFR", "CommonNamesSP", "CommonNamesEN" }' > "$OUTPUT_FILE"

# Traiter chaque ligne (ignorer l'en-tête)
echo "👉 Traitement des lignes depuis $INPUT_FILE..."
counter=0
tail -n +2 "$INPUT_FILE" | while IFS=$'\t' read -r line; do
    counter=$((counter + 1))
    echo "📌 Traitement ligne $counter/$total_lines"
    
    # Extraire Genus et Species (2ème et 3ème colonne)
    genus=$(echo "$line" | awk -F'\t' '{ print $2 }')
    species=$(echo "$line" | awk -F'\t' '{ print $3 }')
    fullname="$genus $species"
    
    echo "🌴 Requête pour: $fullname"
    
    # URL encode
    encoded_name=$(echo "$fullname" | sed 's/ /+/g')
    
    # Obtenir la clé taxonomique depuis GBIF
    taxon_key=$(curl -s "https://api.gbif.org/v1/species?name=${encoded_name}" | \
                jq -r '.results[0].key' 2>/dev/null)
    
    if [ -n "$taxon_key" ] && [ "$taxon_key" != "null" ]; then
        echo "👉 Clé taxonomique trouvée: $taxon_key. Récupération des noms communs..."
        
        # Récupérer les noms vernaculaires
        vernacular_response=$(curl -s "https://api.gbif.org/v1/species/${taxon_key}/vernacularNames")
        
        # Extraire les noms en français, espagnol et anglais
        # Français (fra)
        name_fr=$(echo "$vernacular_response" | \
                 jq -r '.results[] | select(.language == "fra") | .vernacularName' 2>/dev/null | \
                 sort | uniq | paste -sd ", " -)
        
        # Espagnol (spa ou esp)
        name_es=$(echo "$vernacular_response" | \
                 jq -r '.results[] | select(.language == "spa" or .language == "esp") | .vernacularName' 2>/dev/null | \
                 sort | uniq | paste -sd ", " -)
        
        # Anglais (eng)
        name_en=$(echo "$vernacular_response" | \
                 jq -r '.results[] | select(.language == "eng") | .vernacularName' 2>/dev/null | \
                 sort | uniq | paste -sd ", " -)
        
        # Gérer les cas vides
        name_fr=${name_fr:-"Pas de nom commun"}
        name_es=${name_es:-"Sin nombre común"}
        name_en=${name_en:-"No Common Name"}
        
        echo "🌿 Noms communs pour $fullname:"
        echo "   FR: $name_fr"
        echo "   ES: $name_es"
        echo "   EN: $name_en"
    else
        echo "❌ Aucune clé taxonomique trouvée pour $fullname."
        name_fr="NotFound"
        name_es="NotFound"
        name_en="NotFound"
    fi
    
    # Ajouter au fichier de sortie avec des séparate    urs de tabulation
    echo -e "${line}\t${name_fr}\t${name_es}\t${name_en}" >> "$OUTPUT_FILE"
    
    echo "💤 Pause de $DELAY secondes..."
    sleep "$DELAY"
done

echo "✅ Terminé ! Résultat enregistré dans $OUTPUT_FILE."