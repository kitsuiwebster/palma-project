#!/usr/bin/env python3
"""Check Argentina and China geometries in map.geojson"""

import json

def check_geometries():
    # Load map data
    with open('src/assets/data/map.geojson', 'r') as f:
        map_data = json.load(f)
    
    for feature in map_data['features']:
        location_code = feature['properties']['locationCode']
        
        if location_code in ['ARG', 'CHN']:
            name = feature['properties']['name']
            species_count = feature['properties']['speciesCount']
            geometry = feature['geometry']
            
            print(f"\n{name} ({location_code}):")
            print(f"  Species: {species_count}")
            print(f"  Geometry type: {geometry['type']}")
            
            if geometry['type'] == 'Polygon':
                coords = geometry['coordinates']
                print(f"  Coordinate rings: {len(coords)}")
                if coords:
                    print(f"  First ring points: {len(coords[0])}")
                    print(f"  First point: {coords[0][0]}")
                    print(f"  Last point: {coords[0][-1]}")
                    # Check if polygon is closed
                    if coords[0][0] == coords[0][-1]:
                        print("  ✓ Polygon is properly closed")
                    else:
                        print("  ✗ Polygon is NOT closed!")
            elif geometry['type'] == 'MultiPolygon':
                coords = geometry['coordinates']
                print(f"  Polygon count: {len(coords)}")
                for i, polygon in enumerate(coords):
                    print(f"  Polygon {i+1}: {len(polygon)} rings")
                    if polygon:
                        print(f"    Ring 1: {len(polygon[0])} points")
                        print(f"    First point: {polygon[0][0]}")
                        print(f"    Last point: {polygon[0][-1]}")
                        # Check if polygon is closed
                        if polygon[0][0] == polygon[0][-1]:
                            print(f"    ✓ Polygon {i+1} is properly closed")
                        else:
                            print(f"    ✗ Polygon {i+1} is NOT closed!")

if __name__ == '__main__':
    check_geometries()