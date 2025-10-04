#!/usr/bin/env python3
"""Fix map issues with Georgia, New Guinea, Carolinas, etc."""

import json

def fix_map_issues():
    # Read current map data
    with open('src/assets/data/map.geojson', 'r') as f:
        data = json.load(f)

    print("Before fixes:")
    problem_codes = ['GEO', 'NWG', 'SCA', 'NCA']
    for feature in data['features']:
        code = feature['properties']['locationCode']
        name = feature['properties']['name']
        if code in problem_codes:
            print(f"  {code}: {name}")

    # Fix the issues
    for feature in data['features']:
        code = feature['properties']['locationCode']
        name = feature['properties']['name']
        
        # Fix Georgia (state) vs Georgia (country) confusion
        if code == 'GEO' and name == 'Georgia' and 'species' in str(feature['properties']):
            # This should be Georgia the US state, not the country
            # Check the geometry to see if it's in the right location
            # If it's in Europe/Asia, it's the wrong Georgia
            coords = feature['geometry']['coordinates']
            if isinstance(coords, list) and len(coords) > 0:
                # Get a sample coordinate to check location
                sample_coord = None
                if isinstance(coords[0], list):
                    if isinstance(coords[0][0], list):
                        if isinstance(coords[0][0][0], list):
                            sample_coord = coords[0][0][0][0] if len(coords[0][0][0]) > 0 else None
                        else:
                            sample_coord = coords[0][0][0] if len(coords[0][0]) > 0 else None
                    else:
                        sample_coord = coords[0][0] if len(coords[0]) > 0 else None
                
                if sample_coord and isinstance(sample_coord, (int, float)):
                    longitude = sample_coord
                    # Georgia (country) is around 44°E, Georgia (US state) is around -83°W
                    if longitude > 20:  # This is Georgia the country, wrong!
                        print(f"  FIXING: {code} is Georgia (country) at {longitude}°, should be Georgia (US state)")
                        feature['properties']['name'] = 'Georgia'
                        # We need to replace with proper US Georgia coordinates
                        # For now, let's create a simple rectangle for Georgia US
                        feature['geometry'] = {
                            'type': 'Polygon',
                            'coordinates': [[
                                [-85.605165, 30.357851],  # SW
                                [-80.751429, 30.357851],  # SE
                                [-80.751429, 35.000659],  # NE
                                [-85.605165, 35.000659],  # NW
                                [-85.605165, 30.357851]   # Close
                            ]]
                        }
        
        # Fix New Guinea - should be Papua New Guinea, not Australia
        elif code == 'NWG' and name == 'Australia':
            print(f"  FIXING: {code} is labeled as 'Australia', should be 'New Guinea'")
            feature['properties']['name'] = 'New Guinea'
            # Create proper New Guinea coordinates (Papua New Guinea + Indonesian Papua)
            feature['geometry'] = {
                'type': 'Polygon',
                'coordinates': [[
                    [130.5, -9.5],   # SW
                    [150.5, -9.5],   # SE
                    [150.5, -2.0],   # NE
                    [130.5, -2.0],   # NW
                    [130.5, -9.5]    # Close
                ]]
            }

    # Check if we need to add missing entries
    existing_codes = {f['properties']['locationCode'] for f in data['features']}
    
    # Add North Carolina if missing
    if 'NCA' not in existing_codes:
        print("  ADDING: North Carolina (NCA) was missing")
        data['features'].append({
            'type': 'Feature',
            'properties': {
                'name': 'North Carolina',
                'locationCode': 'NCA',
                'speciesCount': 2,  # You mentioned this earlier
                'densityZone': 'Very Low Density',
                'color': '#fefd95',
                'isPalmZone': True
            },
            'geometry': {
                'type': 'Polygon',
                'coordinates': [[
                    [-84.321869, 33.842316],  # SW
                    [-75.460621, 33.842316],  # SE
                    [-75.460621, 36.588117],  # NE
                    [-84.321869, 36.588117],  # NW
                    [-84.321869, 33.842316]   # Close
                ]]
            }
        })

    # Check region_codes.json for Tristan da Cunha
    with open('src/assets/data/region_codes.json', 'r') as f:
        region_codes = json.load(f)
    
    # Add TDC to region_codes.json if missing
    if 'TDC' not in region_codes:
        print("  ADDING: TDC (Tristan da Cunha) to region_codes.json")
        region_codes['TDC'] = {
            "name": "Tristan da Cunha",
            "flag": "https://flagcdn.com/w20/ta.png"  # TA is Tristan da Cunha territory code
        }
        
        # Save updated region_codes.json
        with open('src/assets/data/region_codes.json', 'w') as f:
            json.dump(region_codes, f, indent=2, separators=(',', ': '))

    # Save updated map
    with open('src/assets/data/map.geojson', 'w') as f:
        json.dump(data, f, separators=(',', ':'))

    print("\nAfter fixes:")
    for feature in data['features']:
        code = feature['properties']['locationCode']
        name = feature['properties']['name']
        if code in problem_codes:
            print(f"  {code}: {name}")

    print("\n✅ Map issues fixed!")

if __name__ == '__main__':
    fix_map_issues()