#!/usr/bin/env python3
"""
Combine Malaysia peninsula and Borneo into unified Malaysia GeoJSON
"""

import json

def combine_malaysia_borneo():
    # Load Malaysia peninsula
    with open('areas/MLY_Malaysia.geojson', 'r') as f:
        malaysia_data = json.load(f)
    
    # Load Borneo
    with open('areas/BOR_Borneo.geojson', 'r') as f:
        borneo_data = json.load(f)
    
    # Get Malaysia feature
    malaysia_feature = malaysia_data['features'][0]
    
    # Get Borneo feature  
    borneo_feature = borneo_data['features'][0]
    
    # Add Borneo coordinates to Malaysia coordinates
    malaysia_coords = malaysia_feature['geometry']['coordinates']
    borneo_coords = borneo_feature['geometry']['coordinates']
    
    # Combine: Malaysia peninsula + Borneo
    combined_coords = malaysia_coords + borneo_coords
    
    print(f"Malaysia peninsula polygons: {len(malaysia_coords)}")
    print(f"Borneo polygons: {len(borneo_coords)}")
    print(f"Combined polygons: {len(combined_coords)}")
    
    # Create unified Malaysia feature
    unified_feature = {
        "type": "Feature",
        "properties": {
            "name": "Malaysia",
            "locationCode": "MLY",
            "speciesCount": 481
        },
        "geometry": {
            "type": "MultiPolygon",
            "coordinates": combined_coords
        }
    }
    
    # Create unified GeoJSON
    unified_geojson = {
        "type": "FeatureCollection",
        "features": [unified_feature]
    }
    
    # Save unified Malaysia
    with open('areas/MLY_Malaysia.geojson', 'w') as f:
        json.dump(unified_geojson, f, separators=(',', ':'))
    
    print("✅ Combined Malaysia peninsula + Borneo into unified MLY_Malaysia.geojson")

if __name__ == '__main__':
    combine_malaysia_borneo()