#!/usr/bin/env python3
"""Create subdivision geojson files using country boundaries with subdivision-specific species counts"""

import json
import os

def count_species_by_subdivision():
    """Count species for each subdivision from location.csv"""
    
    subdivision_counts = {}
    
    # Read location.csv and count species per subdivision
    with open('src/assets/data/location.csv', 'r') as f:
        lines = f.readlines()
        for line in lines[1:]:  # Skip header
            parts = line.strip().split(',')
            if len(parts) >= 2:
                code = parts[0]
                species = parts[1]
                
                if code not in subdivision_counts:
                    subdivision_counts[code] = set()
                subdivision_counts[code].add(species)
    
    # Convert sets to counts
    for code in subdivision_counts:
        subdivision_counts[code] = len(subdivision_counts[code])
    
    return subdivision_counts

def get_subdivision_names():
    """Get subdivision names from region_codes.json"""
    
    with open('src/assets/data/region_codes.json', 'r') as f:
        region_codes = json.load(f)
    
    subdivision_names = {}
    for code, data in region_codes.items():
        subdivision_names[code] = data.get('name', code)
    
    return subdivision_names

def create_subdivision_files():
    """Create subdivision geojson files"""
    
    # Get species counts and names
    species_counts = count_species_by_subdivision()
    subdivision_names = get_subdivision_names()
    
    # Define country mappings and their subdivision codes
    countries = {
        'BRA': {
            'subdivisions': ['BZC', 'BZE', 'BZL', 'BZN', 'BZS'],
            'file': 'src/assets/data/areas/BRA_Brazil.geojson'
        },
        'CHN': {
            'subdivisions': ['CHC', 'CHH', 'CHS', 'CHT'],
            'file': 'src/assets/data/areas/CHN_China.geojson'
        },
        'MEX': {
            'subdivisions': ['MXC', 'MXE', 'MXG', 'MXI', 'MXN', 'MXS', 'MXT'],
            'file': 'src/assets/data/areas/MEX_Mexico.geojson'
        },
        'ARG': {
            'subdivisions': ['AGE', 'AGW'],
            'file': 'src/assets/data/areas/ARG_Argentina.geojson'
        }
    }
    
    created_files = []
    
    for country_code, info in countries.items():
        # Load the country's geojson file
        country_file = info['file']
        
        if not os.path.exists(country_file):
            print(f"❌ Country file not found: {country_file}")
            continue
            
        try:
            with open(country_file, 'r') as f:
                country_data = json.load(f)
            
            # Get the geometry from the country file
            if (country_data.get('type') == 'FeatureCollection' and 
                'features' in country_data and 
                len(country_data['features']) > 0):
                
                country_geometry = country_data['features'][0]['geometry']
                
                print(f"\n=== Creating subdivisions for {country_code} ===")
                
                # Create subdivision files
                for subdivision_code in info['subdivisions']:
                    if subdivision_code in species_counts:
                        species_count = species_counts[subdivision_code]
                        subdivision_name = subdivision_names.get(subdivision_code, subdivision_code)
                        
                        # Create subdivision geojson
                        subdivision_geojson = {
                            "type": "FeatureCollection",
                            "features": [{
                                "type": "Feature",
                                "properties": {
                                    "name": subdivision_name,
                                    "locationCode": subdivision_code,
                                    "speciesCount": species_count
                                },
                                "geometry": country_geometry
                            }]
                        }
                        
                        # Save subdivision file
                        filename = f"{subdivision_code}_{subdivision_name.replace(' ', '_')}.geojson"
                        filepath = os.path.join('src/assets/data/areas/', filename)
                        
                        with open(filepath, 'w') as f:
                            json.dump(subdivision_geojson, f, indent=2)
                        
                        created_files.append(filename)
                        print(f"✅ {subdivision_code}: {subdivision_name} ({species_count} species)")
                    else:
                        print(f"⚠️  No species data found for {subdivision_code}")
            else:
                print(f"❌ Invalid country file structure: {country_file}")
                
        except Exception as e:
            print(f"❌ Error processing {country_file}: {e}")
    
    print(f"\n🎯 Created {len(created_files)} subdivision files!")
    return created_files

if __name__ == '__main__':
    create_subdivision_files()