#!/usr/bin/env python3
import requests
import json

# Get Papua New Guinea boundaries from the dataset
url = "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson"
response = requests.get(url)
data = response.json()

# Find Papua New Guinea
png_feature = None
for feature in data['features']:
    if feature['properties']['name'] == 'Papua New Guinea':
        png_feature = feature
        break

if png_feature:
    # Create the New Guinea GeoJSON with proper properties
    new_guinea_geojson = {
        "type": "Feature",
        "properties": {
            "name": "New Guinea",
            "locationCode": "NWG"
        },
        "geometry": png_feature['geometry']
    }
    
    # Save to file
    with open('/workspace/app/src/assets/data/areas/NWG_New_Guinea.geojson', 'w') as f:
        json.dump(new_guinea_geojson, f, indent=4)
    
    print("✅ New Guinea boundaries updated successfully!")
else:
    print("❌ Papua New Guinea not found in dataset")