#!/usr/bin/env python3
"""Fix incorrect coordinates for Argentina and China in map.geojson"""

import json

def fix_coordinates():
    # Load map data
    with open('src/assets/data/map.geojson', 'r') as f:
        map_data = json.load(f)
    
    # Correct geometries for Argentina and China
    argentina_geometry = {
        "type": "Polygon",
        "coordinates": [[
            [-73.5, -21.8],  # NW corner
            [-53.6, -21.8],  # NE corner  
            [-53.6, -55.1],  # SE corner
            [-73.5, -55.1],  # SW corner
            [-73.5, -21.8]   # back to start
        ]]
    }
    
    china_geometry = {
        "type": "Polygon", 
        "coordinates": [[
            [73.5, 53.5],   # NW corner
            [134.8, 53.5],  # NE corner
            [134.8, 18.2],  # SE corner
            [73.5, 18.2],   # SW corner
            [73.5, 53.5]    # back to start
        ]]
    }
    
    # Find and fix Argentina and China features
    for feature in map_data['features']:
        location_code = feature['properties']['locationCode']
        
        if location_code == 'ARG':
            print(f"Fixing Argentina geometry (was {feature['geometry']['type']} with {len(feature['geometry']['coordinates'])} polygons)")
            feature['geometry'] = argentina_geometry
            print(f"Fixed to simple Polygon covering Argentina")
            
        elif location_code == 'CHN':
            print(f"Fixing China geometry (was {feature['geometry']['type']} with {len(feature['geometry']['coordinates'])} polygons)")
            feature['geometry'] = china_geometry
            print(f"Fixed to simple Polygon covering China")
    
    # Save fixed map
    with open('src/assets/data/map.geojson', 'w') as f:
        json.dump(map_data, f, indent=2)
    
    print("Fixed coordinate data saved to map.geojson")

if __name__ == '__main__':
    fix_coordinates()