#!/usr/bin/env python3
"""Fix China, Argentina, and Mexico subdivisions in map.geojson"""

import json

def main():
    # Read current map data
    with open('src/assets/data/map.geojson', 'r') as f:
        data = json.load(f)

    # Read region codes for names
    with open('src/assets/data/region_codes.json', 'r') as f:
        region_codes = json.load(f)

    # Define subdivisions with species counts
    subdivisions = {
        # China subdivisions (replace CHN)
        'CHC': {'name': 'China Central', 'species': 39, 'color': '#F4A460'},
        'CHH': {'name': 'China South Central', 'species': 28, 'color': '#F4A460'},
        'CHS': {'name': 'China South', 'species': 35, 'color': '#F4A460'},
        'CHT': {'name': 'China Tibet', 'species': 5, 'color': '#fefd95'},
        
        # Argentina subdivisions (replace ARG) 
        'AGE': {'name': 'Argentina East', 'species': 12, 'color': '#F4A460'},
        'AGW': {'name': 'Argentina West', 'species': 3, 'color': '#fefd95'},
        
        # Mexico subdivisions (replace MEX)
        'MXC': {'name': 'Mexico Central', 'species': 8, 'color': '#fefd95'},
        'MXE': {'name': 'Mexico East', 'species': 12, 'color': '#F4A460'},
        'MXG': {'name': 'Mexico Gulf', 'species': 35, 'color': '#F4A460'},
        'MXI': {'name': 'Mexico', 'species': 1, 'color': '#fefd95'},
        'MXN': {'name': 'Mexico North', 'species': 11, 'color': '#F4A460'},
        'MXS': {'name': 'Mexico South', 'species': 47, 'color': '#F4A460'},
        'MXT': {'name': 'Mexico Southwest', 'species': 59, 'color': '#CD5C5C'},
    }

    # Get geometries for countries to replace
    geometries = {}
    countries_to_replace = {'CHN': 'china', 'ARG': 'argentina', 'MEX': 'mexico'}
    
    for feature in data['features']:
        code = feature['properties']['locationCode']
        if code in countries_to_replace:
            geometries[countries_to_replace[code]] = feature['geometry']
            print(f'Found {code}: {feature["properties"]["name"]} ({feature["properties"]["speciesCount"]} species)')

    # Remove old country entries
    new_features = []
    for f in data['features']:
        if f['properties']['locationCode'] not in countries_to_replace:
            new_features.append(f)
    data['features'] = new_features

    # Add subdivisions
    for code, info in subdivisions.items():
        # Determine which country geometry to use
        if code.startswith('CH'):
            geometry = geometries.get('china')
            country = 'China'
        elif code.startswith('AG'):
            geometry = geometries.get('argentina') 
            country = 'Argentina'
        elif code.startswith('MX'):
            geometry = geometries.get('mexico')
            country = 'Mexico'
        else:
            continue

        if geometry:
            new_feature = {
                'type': 'Feature',
                'properties': {
                    'name': info['name'],
                    'locationCode': code,
                    'speciesCount': info['species'],
                    'densityZone': 'Medium Density' if info['species'] > 30 else 'Low Density' if info['species'] > 10 else 'Very Low Density',
                    'color': info['color'],
                    'isPalmZone': True
                },
                'geometry': geometry
            }
            data['features'].append(new_feature)

    # Save updated geojson
    with open('src/assets/data/map.geojson', 'w') as f:
        json.dump(data, f, separators=(',', ':'))

    print(f'\n✅ Replaced CHN, ARG, MEX with {len(subdivisions)} subdivisions')
    
    # Verify the changes
    print('\nVerifying changes in map.geojson...')
    with open('src/assets/data/map.geojson', 'r') as f:
        data = json.load(f)
    
    target_codes = list(subdivisions.keys())
    found_subdivisions = []
    
    for feature in data['features']:
        code = feature['properties']['locationCode']
        if code in target_codes:
            found_subdivisions.append(f'  {code}: {feature["properties"]["name"]} ({feature["properties"]["speciesCount"]} species)')
    
    if found_subdivisions:
        print('\nAdded subdivisions:')
        for item in sorted(found_subdivisions):
            print(item)
    else:
        print('❌ No subdivisions found in updated map!')

if __name__ == '__main__':
    main()