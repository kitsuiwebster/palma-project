#!/usr/bin/env python3
"""
Get complete Malaysia GeoJSON from API
"""

import requests
import json

def get_malaysia_geojson():
    # Try Natural Earth API for Malaysia
    url = "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"
    
    try:
        print("🌍 Fetching world GeoJSON data...")
        response = requests.get(url)
        response.raise_for_status()
        
        world_data = response.json()
        
        # Find Malaysia
        malaysia_feature = None
        for feature in world_data['features']:
            props = feature.get('properties', {})
            name = props.get('NAME', '').lower()
            name_en = props.get('NAME_EN', '').lower()
            
            if 'malaysia' in name or 'malaysia' in name_en:
                malaysia_feature = feature
                break
        
        if not malaysia_feature:
            print("❌ Malaysia not found in world data")
            return False
        
        # Update properties
        malaysia_feature['properties'] = {
            "name": "Malaysia",
            "locationCode": "MLY",
            "speciesCount": 481
        }
        
        # Create Malaysia GeoJSON
        malaysia_geojson = {
            "type": "FeatureCollection",
            "features": [malaysia_feature]
        }
        
        # Save to file
        with open('areas/MLY_Malaysia.geojson', 'w') as f:
            json.dump(malaysia_geojson, f, separators=(',', ':'))
        
        print("✅ Created complete MLY_Malaysia.geojson with peninsula + Borneo")
        return True
        
    except Exception as e:
        print(f"❌ Error fetching Malaysia data: {e}")
        
        # Fallback: try REST Countries API
        try:
            print("🔄 Trying alternative API...")
            url2 = "https://restcountries.com/v3.1/name/malaysia"
            response2 = requests.get(url2)
            response2.raise_for_status()
            
            print("⚠️ REST Countries API doesn't provide GeoJSON boundaries")
            return False
            
        except:
            print("❌ All APIs failed")
            return False

if __name__ == '__main__':
    success = get_malaysia_geojson()
    if not success:
        print("\n💡 Alternative: Manual download from Natural Earth")
        print("https://www.naturalearthdata.com/downloads/50m-cultural-vectors/")