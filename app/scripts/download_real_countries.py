#!/usr/bin/env python3
"""Download real country boundaries from reliable sources"""

import json
import urllib.request
import os

def download_country_geojson(iso_code, country_name):
    """Download country GeoJSON from REST Countries GeoJSON API"""
    
    # Try REST Countries GeoJSON service
    url = f"https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"
    
    try:
        print(f"Downloading world data to extract {country_name}...")
        with urllib.request.urlopen(url) as response:
            world_data = json.loads(response.read().decode())
        
        # Find the specific country
        for feature in world_data.get('features', []):
            props = feature.get('properties', {})
            
            # Check various name and code fields
            names = [
                props.get('NAME', ''),
                props.get('NAME_LONG', ''), 
                props.get('ADMIN', ''),
                props.get('NAME_EN', ''),
                props.get('BRK_NAME', '')
            ]
            
            codes = [
                props.get('ISO_A3', ''),
                props.get('ADM0_A3', ''),
                props.get('ISO_A2', '')
            ]
            
            # Match by name or code
            country_lower = country_name.lower()
            found = False
            
            for name in names:
                if name and (country_lower in name.lower() or name.lower() == country_lower):
                    found = True
                    break
            
            for code in codes:
                if code and code.upper() == iso_code.upper():
                    found = True
                    break
            
            if found:
                print(f"✅ Found {country_name}: {props.get('NAME', 'Unknown')}")
                return feature['geometry']
        
        print(f"❌ {country_name} not found in world data")
        return None
        
    except Exception as e:
        print(f"❌ Error downloading {country_name}: {e}")
        return None

def try_alternative_source(iso_code, country_name):
    """Try alternative source for country data"""
    
    # Alternative: Natural Earth data via GitHub
    url = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson"
    
    try:
        print(f"Trying alternative source for {country_name}...")
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode())
        
        for feature in data.get('features', []):
            props = feature.get('properties', {})
            
            # Check name and ISO fields
            name = props.get('NAME', '').lower()
            name_long = props.get('NAME_LONG', '').lower()
            iso_a3 = props.get('ISO_A3', '').upper()
            
            country_lower = country_name.lower()
            
            if (country_lower in name or name in country_lower or 
                country_lower in name_long or name_long in country_lower or
                iso_a3 == iso_code.upper()):
                
                print(f"✅ Found {country_name} in alternative source")
                return feature['geometry']
        
        print(f"❌ {country_name} not found in alternative source")
        return None
        
    except Exception as e:
        print(f"❌ Alternative source failed for {country_name}: {e}")
        return None

def download_and_save_countries():
    """Download and save real country boundaries"""
    
    countries = {
        'BRA': {'name': 'Brazil', 'species': 428},
        'CHN': {'name': 'China', 'species': 107},
        'MEX': {'name': 'Mexico', 'species': 172}, 
        'ARG': {'name': 'Argentina', 'species': 15}
    }
    
    geojson_dir = 'src/assets/data/areas/'
    updated_files = []
    
    for code, data in countries.items():
        print(f"\n=== Processing {data['name']} ({code}) ===")
        
        # Try to download real geometry
        geometry = download_country_geojson(code, data['name'])
        
        if not geometry:
            # Try alternative source
            geometry = try_alternative_source(code, data['name'])
        
        if geometry:
            # Create complete GeoJSON
            geojson = {
                "type": "FeatureCollection",
                "features": [{
                    "type": "Feature",
                    "properties": {
                        "name": data['name'],
                        "locationCode": code,
                        "speciesCount": data['species']
                    },
                    "geometry": geometry
                }]
            }
            
            # Save to file
            filename = f"{code}_{data['name']}.geojson"
            filepath = os.path.join(geojson_dir, filename)
            
            try:
                with open(filepath, 'w') as f:
                    json.dump(geojson, f, indent=2)
                
                updated_files.append(filename)
                print(f"✅ Saved {filename}")
                
                # Show geometry stats
                geom_type = geometry.get('type', 'Unknown')
                if geom_type == 'Polygon':
                    coord_count = len(geometry['coordinates'][0]) if geometry['coordinates'] else 0
                elif geom_type == 'MultiPolygon':
                    coord_count = sum(len(poly[0]) for poly in geometry['coordinates']) if geometry['coordinates'] else 0
                else:
                    coord_count = 0
                
                print(f"   Geometry: {geom_type} with {coord_count} coordinate points")
                
            except Exception as e:
                print(f"❌ Error saving {filename}: {e}")
        else:
            print(f"❌ Could not download real boundaries for {data['name']}")
    
    print(f"\n🎯 Successfully downloaded {len(updated_files)} countries with real boundaries!")
    return updated_files

if __name__ == '__main__':
    download_and_save_countries()