#!/bin/bash

INPUT_FILE="dataset.txt"
OUTPUT_FILE="with_images.txt"
DELAY=5 # seconds

echo "👉 Starting image fetch script..."
echo "👉 Input file: $INPUT_FILE"
echo "👉 Output file: $OUTPUT_FILE"
echo "👉 Delay between API calls: $DELAY seconds"

# Count total lines excluding header
total_lines=$(($(wc -l < "$INPUT_FILE") - 1))
echo "👉 Total lines to process: $total_lines"

# Write header with new columns
echo "👉 Writing header to $OUTPUT_FILE..."
head -n1 "$INPUT_FILE" | awk -v OFS="\t" '{ print $0, "Photos", "PhotoReferences" }' > "$OUTPUT_FILE"

# Process each line (skip header)
echo "👉 Processing lines from $INPUT_FILE..."
counter=0
tail -n +2 "$INPUT_FILE" | while IFS=$'\t' read -r line; do
  counter=$((counter + 1))
  echo "📌 Processing line $counter/$total_lines"

  # Extract Genus and Species (2nd and 3rd column)
  genus=$(echo "$line" | awk -F'\t' '{ print $2 }')
  species=$(echo "$line" | awk -F'\t' '{ print $3 }')
  fullname="$genus $species"

  echo "🌴 Querying: $fullname"

  # URL encode
  encoded_name=$(echo "$fullname" | sed 's/ /%20/g')

  # Get taxon ID from iNaturalist
  id=$(curl -s "https://api.inaturalist.org/v1/search?q=${encoded_name}&sources=taxa" | \
    jq -r '.results[] | select(.record.rank == "species") | .record.id' | head -n1)

  if [ -n "$id" ]; then
    echo "👉 Found taxon ID: $id. Fetching images..."

    # Fetch images info
    response=$(curl -s "https://api.inaturalist.org/v1/taxa/$id")

    # Extract image URLs and attributions
    photos=$(echo "$response" | jq -r '.results[0].taxon_photos[] | .photo.large_url' | paste -sd ' ' -)
    references=$(echo "$response" | jq -r '.results[0].taxon_photos[] | .photo.attribution' | paste -sd ' ' -)

    # Handle empty cases
    photos=${photos:-NoImages}
    references=${references:-NoReferences}

  else
    echo "❌ No taxon ID found for $fullname."
    photos="NotFound"
    references="NotFound"
  fi

  echo "🖼️ Images for $fullname: $photos"

  # Append to output file with tab separators
  echo -e "${line}\t${photos}\t${references}" >> "$OUTPUT_FILE"

  echo "💤 Sleeping for $DELAY seconds..."
  sleep "$DELAY"
done

echo "✅ Done! Output saved to $OUTPUT_FILE."
