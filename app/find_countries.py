#!/usr/bin/env python3
"""Find Argentina, China, and Madagascar in map.geojson"""

import json

def find_countries():
    # Load map data
    with open('src/assets/data/map.geojson', 'r') as f:
        map_data = json.load(f)
    
    print(f"Total features: {len(map_data['features'])}")
    
    found_countries = {}
    
    for i, feature in enumerate(map_data['features']):
        name = feature['properties']['name']
        location_code = feature['properties']['locationCode']
        species_count = feature['properties']['speciesCount']
        color = feature['properties']['color']
        
        if name in ['Argentina', 'China', 'Madagascar']:
            found_countries[name] = {
                'index': i,
                'locationCode': location_code,
                'speciesCount': species_count,
                'color': color
            }
            print(f"\n{name} ({location_code}):")
            print(f"  Position: {i}")
            print(f"  Species: {species_count}")
            print(f"  Color: {color}")
    
    if 'Argentina' not in found_countries:
        print("\n❌ Argentina NOT FOUND")
    if 'China' not in found_countries:
        print("\n❌ China NOT FOUND")
    if 'Madagascar' not in found_countries:
        print("\n❌ Madagascar NOT FOUND")
    
    # Check if any country has 107 or 195 species
    print(f"\nCountries with 107 species:")
    for feature in map_data['features']:
        if feature['properties']['speciesCount'] == 107:
            print(f"  - {feature['properties']['name']} ({feature['properties']['locationCode']})")
    
    print(f"\nCountries with 195 species:")
    for feature in map_data['features']:
        if feature['properties']['speciesCount'] == 195:
            print(f"  - {feature['properties']['name']} ({feature['properties']['locationCode']})")

if __name__ == '__main__':
    find_countries()