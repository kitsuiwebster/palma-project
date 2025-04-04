#!/bin/bash

INPUT_FILE="dataset.txt"
OUTPUT_FILE="with_native.txt"
DELAY=5 # seconds

echo "👉 Starting script..."
echo "👉 Input file: $INPUT_FILE"
echo "👉 Output file: $OUTPUT_FILE"
echo "👉 Delay between API calls: $DELAY seconds"

# Count total lines excluding header
total_lines=$(($(wc -l < "$INPUT_FILE") - 1))
echo "👉 Total lines to process: $total_lines"

# Write header with new column
echo "👉 Writing header to $OUTPUT_FILE..."
head -n1 "$INPUT_FILE" | awk -v OFS="\t" '{ print $0, "NativeRegion" }' > "$OUTPUT_FILE"

# Process each line (skip header)
echo "👉 Processing lines from $INPUT_FILE..."
counter=0
tail -n +2 "$INPUT_FILE" | while IFS=$'\t' read -r line; do
  counter=$((counter + 1))
  echo "📌 Processing line $counter/$total_lines"

  # Extract Genus and Species
  genus=$(echo "$line" | awk -F'\t' '{ print $2 }')
  species=$(echo "$line" | awk -F'\t' '{ print $3 }')
  fullname="$genus $species"

  echo "🌴 Querying: $fullname"

  # URL encode
  encoded_name=$(echo "$fullname" | sed 's/ /%20/g')

  # POWO API: Get fqId for accepted name
  fqid=$(curl -s "https://powo.science.kew.org/api/2/search?q=${encoded_name}" \
    | jq -r '.results[] | select(.accepted==true) | .fqId' | head -n1)

  native=""

  if [ -n "$fqid" ]; then
    echo "👉 Found fqId: $fqid. Fetching taxon details..."
    # Get taxon details
    json=$(curl -s "https://powo.science.kew.org/api/2/taxon/${fqid}")
    # Try to extract possible native region from taxonRemarks
    native=$(echo "$json" | jq -r '.taxonRemarks // empty')
  else
    echo "❌ No fqId found for $fullname."
  fi

  native=${native:-Unknown Native Region}

  echo "🌍 Native region for $fullname: $native"
  echo -e "👉 ${line}\t${native}" >> "$OUTPUT_FILE"

  echo "💤 Sleeping for $DELAY seconds..."
  sleep "$DELAY"
done

echo "✅ Done! Output saved to $OUTPUT_FILE."
