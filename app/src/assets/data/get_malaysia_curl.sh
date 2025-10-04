#!/bin/bash
# Get Malaysia GeoJSON using curl

echo "🌍 Fetching Malaysia boundaries from Natural Earth..."

# Download world boundaries
curl -s "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson" > world_temp.geojson

if [ $? -eq 0 ]; then
    echo "✅ Downloaded world data"
    
    # Extract Malaysia using jq (if available) or Python
    if command -v jq &> /dev/null; then
        echo "🔍 Extracting Malaysia with jq..."
        jq '.features[] | select(.properties.NAME == "Malaysia" or .properties.name == "Malaysia")' world_temp.geojson > malaysia_feature.json
        
        # Wrap in FeatureCollection
        echo '{"type":"FeatureCollection","features":[' > areas/MLY_Malaysia.geojson
        cat malaysia_feature.json >> areas/MLY_Malaysia.geojson
        echo ']}' >> areas/MLY_Malaysia.geojson
        
        # Update properties
        sed -i 's/"NAME":"Malaysia"/"name":"Malaysia","locationCode":"MLY","speciesCount":481/g' areas/MLY_Malaysia.geojson
        
        echo "✅ Created MLY_Malaysia.geojson"
        rm world_temp.geojson malaysia_feature.json
    else
        echo "❌ jq not available, using Python fallback..."
        python3 -c "
import json
with open('world_temp.geojson', 'r') as f:
    world = json.load(f)

malaysia = None
for feature in world['features']:
    props = feature.get('properties', {})
    if props.get('NAME') == 'Malaysia' or props.get('name') == 'Malaysia':
        malaysia = feature
        break

if malaysia:
    malaysia['properties'] = {
        'name': 'Malaysia',
        'locationCode': 'MLY', 
        'speciesCount': 481
    }
    
    result = {
        'type': 'FeatureCollection',
        'features': [malaysia]
    }
    
    with open('areas/MLY_Malaysia.geojson', 'w') as f:
        json.dump(result, f, separators=(',', ':'))
    
    print('✅ Created complete MLY_Malaysia.geojson')
else:
    print('❌ Malaysia not found')
"
        rm world_temp.geojson
    fi
else
    echo "❌ Failed to download world data"
fi