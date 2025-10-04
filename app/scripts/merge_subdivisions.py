#!/usr/bin/env python3
"""Merge subdivisions into new unique trigrammes and update all files"""

import json
import os
import csv
from collections import defaultdict

def analyze_current_subdivisions():
    """Analyze current subdivision data"""
    
    # Read location.csv to understand current subdivisions
    subdivisions = defaultdict(set)
    
    with open('src/assets/data/location.csv', 'r') as f:
        reader = csv.reader(f)
        next(reader)  # Skip header
        for row in reader:
            if len(row) >= 2:
                code = row[0]
                species = row[1]
                subdivisions[code].add(species)
    
    # Define subdivision mappings to new unified codes
    subdivision_mappings = {
        # Brazil subdivisions -> New codes
        'BZC': 'BRA',  # Brazil Central -> Brazil
        'BZE': 'BRE',  # Brazil East
        'BZL': 'BRS',  # Brazil Southeast  
        'BZN': 'BRN',  # Brazil North
        'BZS': 'BRZ',  # Brazil South
        
        # China subdivisions -> New codes
        'CHC': 'CHC',  # China Central (keep same)
        'CHH': 'CHS',  # China South Central -> China South
        'CHS': 'CHE',  # China South -> China East
        'CHT': 'CHT',  # China Tibet (keep same)
        
        # Mexico subdivisions -> New codes
        'MXC': 'MXC',  # Mexico Central (keep same)
        'MXE': 'MXE',  # Mexico East (keep same)
        'MXG': 'MXG',  # Mexico Gulf (keep same)
        'MXI': 'MXI',  # Mexico Islands (keep same)
        'MXN': 'MXN',  # Mexico North (keep same)
        'MXS': 'MXS',  # Mexico South (keep same)
        'MXT': 'MXT',  # Mexico Southeast (keep same)
        
        # Argentina subdivisions -> New codes
        'AGE': 'ARE',  # Argentina East
        'AGW': 'ARW',  # Argentina West
    }
    
    # New region names
    region_names = {
        'BRA': 'Brazil Central',
        'BRE': 'Brazil East', 
        'BRS': 'Brazil Southeast',
        'BRN': 'Brazil North',
        'BRZ': 'Brazil South',
        'CHC': 'China Central',
        'CHS': 'China South',
        'CHE': 'China East', 
        'CHT': 'China Tibet',
        'MXC': 'Mexico Central',
        'MXE': 'Mexico East',
        'MXG': 'Mexico Gulf',
        'MXI': 'Mexico Islands',
        'MXN': 'Mexico North',
        'MXS': 'Mexico South',
        'MXT': 'Mexico Southeast',
        'ARE': 'Argentina East',
        'ARW': 'Argentina West'
    }
    
    print("=== Current subdivisions analysis ===")
    for old_code, new_code in subdivision_mappings.items():
        if old_code in subdivisions:
            count = len(subdivisions[old_code])
            print(f"{old_code} -> {new_code}: {region_names[new_code]} ({count} species)")
    
    return subdivision_mappings, region_names, subdivisions

def handle_shared_regions():
    """Handle regions shared between countries like Borneo"""
    
    shared_mappings = {
        # Borneo is shared between Malaysia and Indonesia
        'BOR': ['MLY', 'IDN'],  # Copy Borneo species to both Malaysia and Indonesia
        
        # Java is part of Indonesia 
        'JAW': ['IDN'],
        
        # Sumatra is part of Indonesia
        'SUM': ['IDN'],
        
        # Sulawesi is part of Indonesia
        'SUL': ['IDN'],
        
        # Moluccas is part of Indonesia
        'MOL': ['IDN']
    }
    
    return shared_mappings

def update_location_csv():
    """Update location.csv with new merged codes"""
    
    subdivision_mappings, region_names, current_subdivisions = analyze_current_subdivisions()
    shared_mappings = handle_shared_regions()
    
    # Read current location.csv
    new_location_data = []
    
    with open('src/assets/data/location.csv', 'r') as f:
        reader = csv.reader(f)
        header = next(reader)
        new_location_data.append(header)
        
        for row in reader:
            if len(row) >= 2:
                old_code = row[0]
                species = row[1]
                
                # Handle subdivision mappings
                if old_code in subdivision_mappings:
                    new_code = subdivision_mappings[old_code]
                    new_row = [new_code] + row[1:]
                    new_location_data.append(new_row)
                    print(f"✅ {old_code} -> {new_code}: {species}")
                
                # Handle shared regions (copy to multiple countries)
                elif old_code in shared_mappings:
                    for target_code in shared_mappings[old_code]:
                        new_row = [target_code] + row[1:]
                        new_location_data.append(new_row)
                        print(f"✅ {old_code} -> {target_code}: {species} (shared)")
                
                # Keep other codes as-is
                else:
                    new_location_data.append(row)
    
    # Write updated location.csv
    with open('src/assets/data/location.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(new_location_data)
    
    print(f"\n🎯 Updated location.csv with merged subdivisions")
    return subdivision_mappings, region_names

def update_areas_csv():
    """Update areas.csv with new merged regions"""
    
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
    
    # Read current areas.csv and update
    new_areas_data = []
    
    with open('src/assets/data/areas.csv', 'r') as f:
        reader = csv.reader(f)
        header = next(reader)
        
        for row in reader:
            if len(row) >= 3:
                code = row[0]
                if code in species_counts:
                    name = region_codes.get(code, {}).get('name', row[1])
                    count = species_counts[code]
                    new_areas_data.append([code, name, count])
    
    # Add any missing codes
    for code, count in species_counts.items():
        if not any(row[0] == code for row in new_areas_data):
            name = region_codes.get(code, {}).get('name', code)
            new_areas_data.append([code, name, count])
    
    # Sort by code
    new_areas_data.sort(key=lambda x: x[0])
    
    # Write updated areas.csv
    with open('src/assets/data/areas.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(new_areas_data)
    
    print(f"\n🎯 Updated areas.csv with {len(new_areas_data)} regions")
    
    # Show key updates
    print("\nKey region updates:")
    for code, count in sorted(species_counts.items()):
        if code in ['BRA', 'BRE', 'BRS', 'BRN', 'BRZ', 'CHC', 'CHS', 'CHE', 'CHT', 
                   'MXC', 'MXE', 'MXG', 'MXI', 'MXN', 'MXS', 'MXT', 'ARE', 'ARW', 'MLY', 'IDN']:
            name = region_codes.get(code, {}).get('name', code)
            print(f"  {code}: {name} ({count} species)")

def update_geojson_files():
    """Update geojson filenames and contents with new codes"""
    
    subdivision_mappings, region_names = analyze_current_subdivisions()[:2]
    shared_mappings = handle_shared_regions()
    
    # Get country geometries for shared regions
    country_geometries = {}
    
    # Load Malaysia geometry for Borneo
    if os.path.exists('src/assets/data/areas/MLY_Malaysia.geojson'):
        with open('src/assets/data/areas/MLY_Malaysia.geojson', 'r') as f:
            malaysia_data = json.load(f)
            if malaysia_data.get('features'):
                country_geometries['MLY'] = malaysia_data['features'][0]['geometry']
    
    # Load or create Indonesia geometry for shared regions
    indonesia_geometry = None
    
    # Create Indonesia geojson if it doesn't exist (from Java)
    if os.path.exists('src/assets/data/areas/JAW_Java.geojson'):
        with open('src/assets/data/areas/JAW_Java.geojson', 'r') as f:
            java_data = json.load(f)
            if java_data.get('features'):
                indonesia_geometry = java_data['features'][0]['geometry']
                country_geometries['IDN'] = indonesia_geometry
    
    # Count species for each new code
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
    
    # Process subdivision file renames/updates
    files_created = []
    
    for old_code, new_code in subdivision_mappings.items():
        old_pattern = f"{old_code}_*.geojson"
        old_files = [f for f in os.listdir('src/assets/data/areas/') if f.startswith(f"{old_code}_")]
        
        for old_filename in old_files:
            old_path = f"src/assets/data/areas/{old_filename}"
            
            # Read old file
            with open(old_path, 'r') as f:
                data = json.load(f)
            
            if data.get('features') and len(data['features']) > 0:
                # Update properties
                data['features'][0]['properties']['locationCode'] = new_code
                data['features'][0]['properties']['name'] = region_names[new_code]
                data['features'][0]['properties']['speciesCount'] = species_counts.get(new_code, 0)
                
                # Create new filename
                new_filename = f"{new_code}_{region_names[new_code].replace(' ', '_')}.geojson"
                new_path = f"src/assets/data/areas/{new_filename}"
                
                # Write new file
                with open(new_path, 'w') as f:
                    json.dump(data, f, indent=2)
                
                files_created.append(new_filename)
                print(f"✅ {old_filename} -> {new_filename}")
                
                # Remove old file
                os.remove(old_path)
    
    # Create shared region files
    for shared_code, target_codes in shared_mappings.items():
        shared_files = [f for f in os.listdir('src/assets/data/areas/') if f.startswith(f"{shared_code}_")]
        
        for shared_filename in shared_files:
            shared_path = f"src/assets/data/areas/{shared_filename}"
            
            # Read shared file
            with open(shared_path, 'r') as f:
                shared_data = json.load(f)
            
            for target_code in target_codes:
                if target_code in country_geometries and target_code in species_counts:
                    # Create file for target country
                    target_data = {
                        "type": "FeatureCollection",
                        "features": [{
                            "type": "Feature",
                            "properties": {
                                "name": "Malaysia" if target_code == 'MLY' else "Indonesia",
                                "locationCode": target_code,
                                "speciesCount": species_counts[target_code]
                            },
                            "geometry": country_geometries[target_code]
                        }]
                    }
                    
                    country_name = "Malaysia" if target_code == 'MLY' else "Indonesia"
                    target_filename = f"{target_code}_{country_name}.geojson"
                    target_path = f"src/assets/data/areas/{target_filename}"
                    
                    with open(target_path, 'w') as f:
                        json.dump(target_data, f, indent=2)
                    
                    files_created.append(target_filename)
                    print(f"✅ Created {target_filename} from {shared_filename}")
    
    print(f"\n🎯 Updated {len(files_created)} geojson files")
    return files_created

if __name__ == '__main__':
    print("=== Merging subdivisions into unique trigrammes ===")
    
    # Step 1: Update location.csv
    print("\n1. Updating location.csv...")
    update_location_csv()
    
    # Step 2: Update areas.csv  
    print("\n2. Updating areas.csv...")
    update_areas_csv()
    
    # Step 3: Update geojson files
    print("\n3. Updating geojson files...")
    update_geojson_files()
    
    print("\n🎯 All subdivisions merged successfully!")