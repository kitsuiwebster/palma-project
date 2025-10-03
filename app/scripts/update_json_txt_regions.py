#!/usr/bin/env python3
"""
Script to update Native Regions in dataset.json and dataset.txt with updated values from dataset.csv
"""
import csv
import json

def main():
    # Step 1: Read updated CSV to get species -> native region mapping
    species_to_region = {}
    
    print("Reading updated dataset.csv...")
    with open('src/assets/data/dataset.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            species_name = row['SpecName']
            native_region = row['NativeRegion']
            species_to_region[species_name] = native_region
    
    print(f"Found {len(species_to_region)} species with updated regions")
    
    # Step 2: Update dataset.json
    print("\nUpdating dataset.json...")
    with open('src/assets/data/dataset.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    updated_count_json = 0
    for species_data in data['data']:
        species_name = species_data['SpecName']
        if species_name in species_to_region:
            old_region = species_data.get('NativeRegion', '')
            new_region = species_to_region[species_name]
            if old_region != new_region:
                species_data['NativeRegion'] = new_region
                updated_count_json += 1
                print(f"JSON - Updated {species_name}: {old_region} -> {new_region}")
    
    # Write updated JSON
    with open('src/assets/data/dataset.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    # Step 3: Update dataset.txt
    print(f"\nUpdating dataset.txt...")
    updated_rows = []
    updated_count_txt = 0
    
    with open('src/assets/data/dataset.txt', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Read header
    header_line = lines[0].strip()
    header_parts = header_line.split('\t')
    
    # Find NativeRegion column index
    try:
        native_region_idx = header_parts.index('NativeRegion')
    except ValueError:
        print("ERROR: NativeRegion column not found in dataset.txt")
        return
    
    updated_rows.append(header_line)
    
    # Process data lines
    for line in lines[1:]:
        parts = line.strip().split('\t')
        if len(parts) > native_region_idx:
            species_name = parts[0]  # SpecName is first column
            
            if species_name in species_to_region:
                old_region = parts[native_region_idx]
                new_region = species_to_region[species_name]
                if old_region != new_region:
                    parts[native_region_idx] = new_region
                    updated_count_txt += 1
                    print(f"TXT - Updated {species_name}: {old_region} -> {new_region}")
        
        updated_rows.append('\t'.join(parts))
    
    # Write updated TXT
    with open('src/assets/data/dataset.txt', 'w', encoding='utf-8') as f:
        f.write('\n'.join(updated_rows))
    
    print(f"\nSummary:")
    print(f"- JSON records updated: {updated_count_json}")
    print(f"- TXT records updated: {updated_count_txt}")

if __name__ == "__main__":
    main()