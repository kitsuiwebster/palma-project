#!/usr/bin/env python3
"""
Script to update Native Regions in dataset.csv with location codes from location.csv
"""
import csv
import re
from collections import defaultdict

def main():
    # Step 1: Read location.csv to get species -> area codes mapping
    species_to_codes = defaultdict(set)
    
    print("Reading location.csv...")
    with open('src/assets/data/location.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            area_code = row['Area_code_L3']
            species_name = row['SpecName']
            # Convert underscore format to space format to match dataset.csv
            species_name_with_spaces = species_name.replace('_', ' ')
            species_to_codes[species_name_with_spaces].add(area_code)
    
    print(f"Found location data for {len(species_to_codes)} species")
    
    # Step 2: Read dataset.csv and update Native Regions
    updated_rows = []
    species_updated = 0
    species_not_found = 0
    
    print("\nReading dataset.csv...")
    with open('src/assets/data/dataset.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        
        for row in reader:
            species_name = row['SpecName']
            old_native_region = row['NativeRegion']
            
            if species_name in species_to_codes:
                # Update with location codes
                codes = sorted(list(species_to_codes[species_name]))
                new_native_region = ', '.join(codes)
                row['NativeRegion'] = new_native_region
                species_updated += 1
                
                print(f"Updated {species_name}:")
                print(f"  Old: {old_native_region}")
                print(f"  New: {new_native_region}")
                print()
            else:
                species_not_found += 1
                print(f"WARNING: No location data found for {species_name}")
            
            updated_rows.append(row)
    
    # Step 3: Write updated dataset.csv
    print(f"\nWriting updated dataset.csv...")
    with open('src/assets/data/dataset.csv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(updated_rows)
    
    print(f"\nSummary:")
    print(f"- Species updated: {species_updated}")
    print(f"- Species not found in locations: {species_not_found}")
    print(f"- Total species: {len(updated_rows)}")

if __name__ == "__main__":
    main()