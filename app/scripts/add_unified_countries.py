#!/usr/bin/env python3
"""Add unified country codes for maps while keeping subdivisions"""

import json
import os
import csv
from collections import defaultdict

def add_unified_entries_to_location_csv():
    """Add unified country entries to location.csv (keeping subdivisions)"""
    
    # Define subdivision to unified country mappings
    unified_mappings = {
        'BRA': ['BZC', 'BZE', 'BZL', 'BZN', 'BZS'],  # Brazil
        'CHN': ['CHC', 'CHH', 'CHS', 'CHT'],          # China  
        'MEX': ['MXC', 'MXE', 'MXG', 'MXI', 'MXN', 'MXS', 'MXT'],  # Mexico
        'ARG': ['AGE', 'AGW'],                        # Argentina
        'IDN': ['JAW', 'SUM', 'SUL', 'MOL'],         # Indonesia
        'MLY': ['BOR']  # Malaysia gets Borneo too
    }
    
    # Also add Borneo to Indonesia
    unified_mappings['IDN'].append('BOR')
    
    # Read current location.csv
    current_data = []
    subdivision_species = defaultdict(set)
    
    with open('src/assets/data/location.csv', 'r') as f:
        reader = csv.reader(f)
        header = next(reader)
        current_data.append(header)
        
        for row in reader:
            if len(row) >= 2:
                code = row[0]
                species = row[1]
                current_data.append(row)
                subdivision_species[code].add(species)
    
    # Add unified entries
    unified_entries = []
    
    for unified_code, subdivision_codes in unified_mappings.items():
        print(f"\n=== {unified_code} ===")
        all_species = set()
        
        for sub_code in subdivision_codes:
            if sub_code in subdivision_species:
                species_count = len(subdivision_species[sub_code])
                all_species.update(subdivision_species[sub_code])
                print(f"  {sub_code}: {species_count} species")
        
        # Add all species for unified code
        for species in all_species:
            unified_entries.append([unified_code, species])
        
        print(f"  -> {unified_code}: {len(all_species)} total species")
    
    # Add unified entries to location data
    current_data.extend(unified_entries)
    
    # Write updated location.csv
    with open('src/assets/data/location.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(current_data)
    
    print(f"\n🎯 Added {len(unified_entries)} unified entries to location.csv")
    return unified_mappings

def update_areas_csv_with_unified():
    """Update areas.csv to include unified countries"""
    
    # Count species by code from updated location.csv
    species_counts = defaultdict(set)
    
    with open('src/assets/data/location.csv', 'r') as f:
        reader = csv.reader(f)
        next(reader)  # Skip header
        for row in reader:
            if len(row) >= 2:
                code = row[0]
                species = row[1]
                species_counts[code].add(species)
    
    # Convert to counts
    for code in species_counts:
        species_counts[code] = len(species_counts[code])
    
    # Get region names
    with open('src/assets/data/region_codes.json', 'r') as f:
        region_codes = json.load(f)
    
    # Read current areas.csv
    current_areas = []
    existing_codes = set()
    
    with open('src/assets/data/areas.csv', 'r') as f:
        reader = csv.reader(f)
        header = next(reader)
        current_areas.append(header)
        
        for row in reader:
            if len(row) >= 3:
                code = row[0]
                existing_codes.add(code)
                # Update count if we have new data
                if code in species_counts:
                    row[2] = str(species_counts[code])
                current_areas.append(row)
    
    # Add new unified countries
    unified_countries = {
        'BRA': 'Brazil',
        'CHN': 'China', 
        'MEX': 'Mexico',
        'ARG': 'Argentina',
        'IDN': 'Indonesia',
        'MLY': 'Malaysia'
    }
    
    for code, name in unified_countries.items():
        if code not in existing_codes and code in species_counts:
            count = species_counts[code]
            current_areas.append([code, name, count])
            print(f"✅ Added {code}: {name} ({count} species)")
    
    # Write updated areas.csv
    with open('src/assets/data/areas.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(current_areas)
    
    print(f"\n🎯 Updated areas.csv")

def create_unified_geojson_files():
    """Create unified country geojson files for maps"""
    
    unified_mappings = {
        'BRA': 'Brazil',
        'CHN': 'China', 
        'MEX': 'Mexico',
        'ARG': 'Argentina',
        'IDN': 'Indonesia',
        'MLY': 'Malaysia'
    }
    
    # Count species for unified countries
    species_counts = defaultdict(set)
    
    with open('src/assets/data/location.csv', 'r') as f:
        reader = csv.reader(f)
        next(reader)
        for row in reader:
            if len(row) >= 2:
                code = row[0]
                species = row[1]
                species_counts[code].add(species)
    
    for code in species_counts:
        species_counts[code] = len(species_counts[code])
    
    # Load real country boundaries (we'll use Natural Earth data)
    created_files = []
    
    for code, name in unified_mappings.items():
        # Try to get real boundaries from existing subdivision files
        subdivision_file = None
        
        # Look for any subdivision file to get country boundaries
        subdivision_patterns = {
            'BRA': 'BZC_',
            'CHN': 'CHC_',
            'MEX': 'MXC_',
            'ARG': 'AGE_',
            'IDN': 'JAW_',
            'MLY': 'MLY_'
        }
        
        if code in subdivision_patterns:
            pattern = subdivision_patterns[code]
            for filename in os.listdir('src/assets/data/areas/'):
                if filename.startswith(pattern):
                    subdivision_file = f"src/assets/data/areas/{filename}"
                    break
        
        # Special case for Malaysia - use existing file
        if code == 'MLY' and os.path.exists('src/assets/data/areas/MLY_Malaysia.geojson'):
            subdivision_file = 'src/assets/data/areas/MLY_Malaysia.geojson'
        
        if subdivision_file and os.path.exists(subdivision_file):
            # Load subdivision file to get country boundaries
            with open(subdivision_file, 'r') as f:
                subdivision_data = json.load(f)
            
            if subdivision_data.get('features') and len(subdivision_data['features']) > 0:
                # Create unified country file
                unified_data = {
                    "type": "FeatureCollection",
                    "features": [{
                        "type": "Feature",
                        "properties": {
                            "name": name,
                            "locationCode": code,
                            "speciesCount": species_counts.get(code, 0)
                        },
                        "geometry": subdivision_data['features'][0]['geometry']
                    }]
                }
                
                filename = f"{code}_{name}.geojson"
                filepath = f"src/assets/data/areas/{filename}"
                
                with open(filepath, 'w') as f:
                    json.dump(unified_data, f, indent=2)
                
                created_files.append(filename)
                print(f"✅ Created {filename} ({species_counts.get(code, 0)} species)")
            else:
                print(f"⚠️  Invalid subdivision file for {code}: {subdivision_file}")
        else:
            print(f"⚠️  No subdivision file found for {code}")
    
    print(f"\n🎯 Created {len(created_files)} unified geojson files")
    return created_files

if __name__ == '__main__':
    print("=== Adding unified countries for maps (keeping subdivisions) ===")
    
    # Step 1: Add unified entries to location.csv
    print("\n1. Adding unified entries to location.csv...")
    add_unified_entries_to_location_csv()
    
    # Step 2: Update areas.csv with unified countries
    print("\n2. Updating areas.csv...")
    update_areas_csv_with_unified()
    
    # Step 3: Create unified geojson files
    print("\n3. Creating unified geojson files...")
    create_unified_geojson_files()
    
    print("\n🎯 Unified countries added successfully!")