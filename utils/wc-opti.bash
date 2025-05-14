#!/bin/bash
INPUT_FILE="dataset.txt"
OUTPUT_FILE="done.txt"
DELAY=5 # seconds
LOGFILE="photo_fetcher.log"

# Vider le fichier log au démarrage
> "$LOGFILE"

echo "👉 Starting image fetch script using Wikimedia Commons..." | tee -a "$LOGFILE"
echo "👉 Input file: $INPUT_FILE" | tee -a "$LOGFILE"
echo "👉 Output file: $OUTPUT_FILE" | tee -a "$LOGFILE"
echo "👉 Delay between API calls: $DELAY seconds" | tee -a "$LOGFILE"
echo "👉 Log file: $LOGFILE" | tee -a "$LOGFILE"

# Count total lines excluding header
total_lines=$(($(wc -l < "$INPUT_FILE") - 1))
echo "👉 Total lines to process: $total_lines" | tee -a "$LOGFILE"

# Write header with new columns
echo "👉 Writing header to $OUTPUT_FILE..." | tee -a "$LOGFILE"
head -n1 "$INPUT_FILE" > "$OUTPUT_FILE"

# Create a temporary file to track processed species to avoid duplicates
PROCESSED_SPECIES_FILE="processed_species.tmp"
> "$PROCESSED_SPECIES_FILE"

# Process each line (skip header)
echo "👉 Processing lines from $INPUT_FILE..." | tee -a "$LOGFILE"
counter=0
tail -n +2 "$INPUT_FILE" | while IFS=$'\t' read -r line; do
  counter=$((counter + 1))
  echo "📌 Processing line $counter/$total_lines" | tee -a "$LOGFILE"
  
  # Extract Genus and Species (2nd and 3rd column)
  genus=$(echo "$line" | awk -F'\t' '{ print $2 }')
  species=$(echo "$line" | awk -F'\t' '{ print $3 }')
  fullname="$genus $species"
  
  # Check if we've already processed this species to avoid duplicates
  if grep -q "^$fullname$" "$PROCESSED_SPECIES_FILE"; then
    echo "⚠️ Species '$fullname' was already processed earlier. Skipping duplicate query." | tee -a "$LOGFILE"
    echo "$line" >> "$OUTPUT_FILE"  # Keep the line unchanged
    continue
  fi
  
  # Add this species to our processed list
  echo "$fullname" >> "$PROCESSED_SPECIES_FILE"
  
  echo "🌴 Querying Wikimedia Commons for: $fullname" | tee -a "$LOGFILE"
  
  # Try multiple search approaches
  found_images=false
  
  # APPROACH 1: Search with quotes and filetype filtering (most specific)
  if [ "$found_images" = false ]; then
    echo "🔍 Trying approach 1: Exact species name with quotes..." | tee -a "$LOGFILE"
    
    # URL encode more thoroughly
    encoded_name=$(echo "$fullname" | perl -MURI::Escape -ne 'print uri_escape($_)')
    
    # Make a specific search query
    search_query="\"$encoded_name\""
    
    # Get images from Wikimedia Commons
    response=$(curl -s "https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=$search_query&gsrnamespace=6&gsrlimit=50&prop=imageinfo&iiprop=url&format=json")
    
    # Check if response contains pages
    if echo "$response" | jq -e '.query.pages' > /dev/null 2>&1; then
      # Extract image URLs and filter by image extensions
      commons_photos=$(echo "$response" | jq -r '.query.pages[].imageinfo[].url' 2>/dev/null | 
        grep -i -E '\.(jpg|jpeg|png|gif)$' | 
        sort -u | 
        paste -sd ' ' -)
      
      if [ -n "$commons_photos" ]; then
        echo "✅ Found images using approach 1!" | tee -a "$LOGFILE"
        found_images=true
      fi
    fi
  fi
  
  # APPROACH 2: Search by genus and species separately (less specific)
  if [ "$found_images" = false ]; then
    echo "🔍 Trying approach 2: Genus + species separately..." | tee -a "$LOGFILE"
    
    # URL encode separately
    encoded_genus=$(echo "$genus" | perl -MURI::Escape -ne 'print uri_escape($_)')
    encoded_species=$(echo "$species" | perl -MURI::Escape -ne 'print uri_escape($_)')
    
    # Search query with both terms but not requiring exact match
    search_query="$encoded_genus $encoded_species"
    
    # Get images from Wikimedia Commons
    response=$(curl -s "https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=$search_query&gsrnamespace=6&gsrlimit=50&prop=imageinfo&iiprop=url&format=json")
    
    # Check if response contains pages
    if echo "$response" | jq -e '.query.pages' > /dev/null 2>&1; then
      # Extract image URLs, filter by image extensions, and ensure relevance by checking for genus AND species in URL
      commons_photos=$(echo "$response" | jq -r '.query.pages[].imageinfo[].url' 2>/dev/null | 
        grep -i -E '\.(jpg|jpeg|png|gif)$' | 
        grep -i -E "$genus.*$species|$species.*$genus" | 
        sort -u | 
        paste -sd ' ' -)
      
      if [ -n "$commons_photos" ]; then
        echo "✅ Found images using approach 2!" | tee -a "$LOGFILE"
        found_images=true
      fi
    fi
  fi
  
  # APPROACH 3: Category search as a last resort
  if [ "$found_images" = false ]; then
    echo "🔍 Trying approach 3: Category search..." | tee -a "$LOGFILE"
    
    # Try looking in species categories
    category_query="Category:$genus $species"
    encoded_category=$(echo "$category_query" | perl -MURI::Escape -ne 'print uri_escape($_)')
    
    # Use the API to get images in the category
    category_response=$(curl -s "https://commons.wikimedia.org/w/api.php?action=query&list=categorymembers&cmtype=file&cmtitle=$encoded_category&cmlimit=50&prop=imageinfo&iiprop=url&format=json")
    
    # Extract file names from category
    if echo "$category_response" | jq -e '.query.categorymembers' > /dev/null 2>&1; then
      category_files=$(echo "$category_response" | jq -r '.query.categorymembers[].title' 2>/dev/null)
      
      if [ -n "$category_files" ]; then
        # For each file, get its URL
        commons_photos=""
        while read -r file; do
          # Remove "File:" prefix and URL encode
          file_name=${file#File:}
          encoded_file=$(echo "$file_name" | perl -MURI::Escape -ne 'print uri_escape($_)')
          
          # Get file info
          file_response=$(curl -s "https://commons.wikimedia.org/w/api.php?action=query&titles=File:$encoded_file&prop=imageinfo&iiprop=url&format=json")
          
          # Extract URL
          file_url=$(echo "$file_response" | jq -r '.query.pages[].imageinfo[].url' 2>/dev/null)
          
          if [ -n "$file_url" ] && echo "$file_url" | grep -q -i -E '\.(jpg|jpeg|png|gif)$'; then
            commons_photos="$commons_photos $file_url"
          fi
        done <<< "$category_files"
        
        commons_photos=$(echo "$commons_photos" | tr ' ' '\n' | grep -v '^$' | sort -u | paste -sd ' ' -)
        
        if [ -n "$commons_photos" ]; then
          echo "✅ Found images using approach 3 (category)!" | tee -a "$LOGFILE"
          found_images=true
        fi
      fi
    fi
  fi
  
  # Extract existing photos from dataset if any (10th column)
  existing_photos=$(echo "$line" | awk -F'\t' '{ print $10 }')
  
  # Only modify the line if we found species-specific photos
  if [ -n "$commons_photos" ]; then
    # Combine Wikimedia photos (at the beginning) with existing photos
    if [ -n "$existing_photos" ] && [ "$existing_photos" != "NoImages" ] && [ "$existing_photos" != "NotFound" ]; then
      # Combine but remove any duplicates
      combined_photos="$commons_photos $existing_photos"
      final_photos=$(echo "$combined_photos" | tr ' ' '\n' | sort -u | paste -sd ' ' -)
    else
      final_photos="$commons_photos"
    fi
    
    # Replace the 10th column (Photos) with our new combined photos
    new_line=$(echo "$line" | awk -v photos="$final_photos" 'BEGIN {FS=OFS="\t"} {$10=photos; print}')
    echo "🖼️ Images added for $fullname: $commons_photos" | tee -a "$LOGFILE"
    
    # Debug info
    echo "📊 Total images found: $(echo "$commons_photos" | tr ' ' '\n' | wc -l)" | tee -a "$LOGFILE"
  else
    # No species-specific images found, keep line unchanged
    new_line="$line"
    echo "ℹ️ No images found for $fullname after trying all approaches." | tee -a "$LOGFILE"
  fi
  
  # Append to output file
  echo "$new_line" >> "$OUTPUT_FILE"
  
  echo "💤 Sleeping for $DELAY seconds..." | tee -a "$LOGFILE"
  sleep "$DELAY"
done

# Clean up temporary file
rm -f "$PROCESSED_SPECIES_FILE"

echo "✅ Done! Output saved to $OUTPUT_FILE." | tee -a "$LOGFILE"
echo "📋 See $LOGFILE for detailed processing information."