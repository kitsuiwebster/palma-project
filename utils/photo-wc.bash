#!/bin/bash
INPUT_FILE="dataset.txt"
OUTPUT_FILE="with_images.txt"
DELAY=5 # seconds
echo "👉 Starting image fetch script using Wikimedia Commons..."
echo "👉 Input file: $INPUT_FILE"
echo "👉 Output file: $OUTPUT_FILE"
echo "👉 Delay between API calls: $DELAY seconds"
# Count total lines excluding header
total_lines=$(($(wc -l < "$INPUT_FILE") - 1))
echo "👉 Total lines to process: $total_lines"
# Write header with new columns
echo "👉 Writing header to $OUTPUT_FILE..."
head -n1 "$INPUT_FILE" > "$OUTPUT_FILE"
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
  echo "🌴 Querying Wikimedia Commons for: $fullname"
  
  # URL encode
  encoded_name=$(echo "$fullname" | sed 's/ /%20/g')
  
  # Get images from Wikimedia Commons for the specific species only
  response=$(curl -s "https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=$encoded_name&gsrnamespace=6&prop=imageinfo&iiprop=url|extmetadata&format=json")
  
  # Extract image URLs and filter only real images (not PDFs)
  commons_photos=$(echo "$response" | jq -r '.query.pages[].imageinfo[].url' 2>/dev/null | grep -i -E '\.(jpg|jpeg|png|gif|svg)$' | paste -sd ' ' -)
  
  # Extract existing photos from dataset if any (10th column)
  existing_photos=$(echo "$line" | awk -F'\t' '{ print $10 }')
  
  # Only modify the line if we found species-specific photos
  if [ -n "$commons_photos" ]; then
    # Combine Wikimedia photos (at the beginning) with existing photos
    if [ -n "$existing_photos" ] && [ "$existing_photos" != "NoImages" ] && [ "$existing_photos" != "NotFound" ]; then
      final_photos="$commons_photos $existing_photos"
    else
      final_photos="$commons_photos"
    fi
    
    # Replace the 10th column (Photos) with our new combined photos
    new_line=$(echo "$line" | awk -v photos="$final_photos" 'BEGIN {FS=OFS="\t"} {$10=photos; print}')
    echo "🖼️ Images added for $fullname: $commons_photos"
  else
    # No species-specific images found, keep line unchanged
    new_line="$line"
    echo "ℹ️ No species-specific images found for $fullname. Line unchanged."
  fi
  
  # Append to output file
  echo "$new_line" >> "$OUTPUT_FILE"
  
  echo "💤 Sleeping for $DELAY seconds..."
  sleep "$DELAY"
done

echo "✅ Done! Output saved to $OUTPUT_FILE."