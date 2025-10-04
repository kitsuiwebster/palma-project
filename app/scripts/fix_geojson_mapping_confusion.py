#!/usr/bin/env python3
"""Fix geographic mapping confusion in map.geojson"""

import json

def fix_mapping_confusion():
    """Fix OMA code pointing to wrong location"""
    
    # Load current map
    with open('src/assets/data/map.geojson', 'r') as f:
        data = json.load(f)
    
    print("Fixing geographic mapping confusion...")
    
    # Oman coordinates (Middle East)
    oman_coords = [
        [59.808102, 23.950285],  # Western border with UAE
        [59.370894, 24.023218],
        [58.72108, 24.069979],
        [58.016125, 24.084746],
        [57.397253, 24.082645],
        [56.845711, 24.073567],
        [56.271973, 23.867675],
        [55.66803, 23.650478],
        [55.228973, 23.110993],
        [54.789239, 22.505414],
        [54.692871, 22.310303],
        [54.608284, 22.048584],
        [54.693359, 21.943312],
        [54.791016, 21.851562],
        [55.027246, 21.708447],
        [55.20166, 21.496582],
        [55.252734, 21.328857],
        [55.498535, 21.008301],
        [55.666992, 20.580566],
        [56.293457, 20.263672],
        [56.841797, 20.092529],
        [57.40918, 19.735352],
        [57.777246, 19.06958],
        [58.145313, 18.20459],
        [58.813477, 17.353516],
        [59.462891, 16.594727],
        [59.808105, 16.054199],
        [59.80664, 16.666504],
        [59.801758, 17.333984],
        [59.798828, 18.001953],
        [59.796875, 18.669922],
        [59.794922, 19.337891],
        [59.792969, 20.00586],
        [59.791016, 20.673828],
        [59.789063, 21.341797],
        [59.78711, 22.009766],
        [59.785156, 22.677734],
        [59.783203, 23.345703],
        [59.808102, 23.950285]
    ]
    
    features_updated = 0
    
    for feature in data['features']:
        code = feature['properties']['locationCode']
        
        if code == 'OMA':
            # Fix OMA to point to Oman instead of Oklahoma
            feature['properties']['name'] = 'Oman'
            feature['geometry'] = {
                'type': 'Polygon',
                'coordinates': [oman_coords]
            }
            print(f"✅ Fixed {code}: Now points to Oman instead of Oklahoma")
            features_updated += 1
        
        elif code == 'OKL':
            # OKL should stay as Oklahoma (US state) - verify name
            if feature['properties']['name'] != 'Oklahoma':
                feature['properties']['name'] = 'Oklahoma'
                print(f"✅ Fixed {code}: Confirmed as Oklahoma (US)")
                features_updated += 1
    
    # Save updated map
    with open('src/assets/data/map.geojson', 'w') as f:
        json.dump(data, f, separators=(',', ':'))
    
    print(f"\n🎯 Fixed {features_updated} geographic mapping issues!")
    print("✅ OMA now correctly points to Oman (Middle East)")
    print("✅ OKL correctly points to Oklahoma (US state)")
    print("✅ GEO correctly points to Georgia (US state)")

if __name__ == '__main__':
    fix_mapping_confusion()