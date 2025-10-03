#!/usr/bin/env python3

import json

# Corriger les noms incorrects dans map.geojson
with open('/workspace/app/src/assets/data/map.geojson', 'r') as f:
    data = json.load(f)

# Charger les vrais noms depuis region_codes
with open('/workspace/app/src/assets/data/region_codes.json', 'r') as f:
    region_codes = json.load(f)

corrections = 0
for feature in data['features']:
    code = feature['properties']['locationCode']
    current_name = feature['properties']['name']
    
    # Si le code existe dans region_codes, utiliser le vrai nom
    if code in region_codes:
        correct_name = region_codes[code]['name']
        if current_name != correct_name and code not in ['ARG', 'BRA', 'CHN', 'MEX']:
            print(f'Correction: {current_name} -> {correct_name} (code: {code})')
            feature['properties']['name'] = correct_name
            corrections += 1

print(f'Total corrections: {corrections}')

# Sauvegarder
with open('/workspace/app/src/assets/data/map.geojson', 'w') as f:
    json.dump(data, f)

print('Fichier corrigé sauvegardé.')