#!/usr/bin/env python3
"""Fix Brazil and Borneo issues in map.geojson"""

import json

def main():
    # Read current map data
    with open('src/assets/data/map.geojson', 'r') as f:
        data = json.load(f)

    # Find Brazil entry and get its coordinates
    brazil_feature = None
    for feature in data['features']:
        if feature['properties']['locationCode'] == 'BRA':
            brazil_feature = feature
            break

    if brazil_feature:
        print('Found BRA entry in map.geojson')
        print(f'Current: {brazil_feature["properties"]["locationCode"]} - {brazil_feature["properties"]["name"]} ({brazil_feature["properties"]["speciesCount"]} species)')
        
        # Get the geometry
        brazil_geometry = brazil_feature['geometry']
        
        # Define Brazil subdivisions with species counts
        brazil_subdivisions = {
            'BZC': {'name': 'Brazil Central', 'species': 72, 'color': '#A52A2A'},
            'BZE': {'name': 'Brazil East', 'species': 85, 'color': '#A52A2A'}, 
            'BZL': {'name': 'Brazil Southeast', 'species': 80, 'color': '#A52A2A'},
            'BZN': {'name': 'Brazil North', 'species': 161, 'color': '#660000'},
            'BZS': {'name': 'Brazil South', 'species': 30, 'color': '#F4A460'}
        }
        
        # Remove old BRA entry
        new_features = []
        for f in data['features']:
            if f['properties']['locationCode'] != 'BRA':
                new_features.append(f)
        data['features'] = new_features
        
        # Add Brazil subdivisions (they will all share the same geometry for now)
        for code, info in brazil_subdivisions.items():
            new_feature = {
                'type': 'Feature',
                'properties': {
                    'name': info['name'],
                    'locationCode': code,
                    'speciesCount': info['species'],
                    'densityZone': 'High Density' if info['species'] > 100 else 'Medium Density' if info['species'] > 50 else 'Low Density',
                    'color': info['color'],
                    'isPalmZone': True
                },
                'geometry': brazil_geometry
            }
            data['features'].append(new_feature)
        
        # Save updated geojson
        with open('src/assets/data/map.geojson', 'w') as f:
            json.dump(data, f, separators=(',', ':'))
            
        print(f'\n✅ Replaced BRA with {len(brazil_subdivisions)} Brazil subdivisions')
        for code, info in brazil_subdivisions.items():
            print(f'  {code}: {info["name"]} ({info["species"]} species)')
    else:
        print('BRA entry not found in map.geojson')

    # Verify the changes
    print('\nVerifying changes in map.geojson...')
    with open('src/assets/data/map.geojson', 'r') as f:
        data = json.load(f)
    
    brazil_codes = ['BZC', 'BZE', 'BZL', 'BZN', 'BZS', 'BRA']
    borneo_codes = ['BOR']
    
    print('\nBrazil entries:')
    for feature in data['features']:
        code = feature['properties']['locationCode']
        if code in brazil_codes:
            print(f'  {code}: {feature["properties"]["name"]} ({feature["properties"]["speciesCount"]} species)')
    
    print('\nBorneo entries:')
    for feature in data['features']:
        code = feature['properties']['locationCode']
        if code in borneo_codes:
            print(f'  {code}: {feature["properties"]["name"]} ({feature["properties"]["speciesCount"]} species)')

if __name__ == '__main__':
    main()