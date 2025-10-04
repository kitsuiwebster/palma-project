#!/usr/bin/env python3
"""Get real boundaries from reliable sources"""

import json
import urllib.request
import urllib.error

def fetch_north_carolina_geojson():
    """Fetch North Carolina GeoJSON from GitHub repository"""
    url = "https://raw.githubusercontent.com/glynnbird/usstatesgeojson/master/north%20carolina.geojson"
    
    try:
        print("Fetching North Carolina boundaries from GitHub...")
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode())
            
        if 'geometry' in data and 'coordinates' in data['geometry']:
            coords = data['geometry']['coordinates']
            print(f"✅ North Carolina: Found {len(coords[0])} coordinate points")
            return coords
        else:
            print("❌ North Carolina: Invalid GeoJSON structure")
            return None
            
    except urllib.error.URLError as e:
        print(f"❌ Error fetching North Carolina data: {e}")
        return None
    except Exception as e:
        print(f"❌ Error processing North Carolina data: {e}")
        return None

def fetch_papua_new_guinea_from_countries():
    """Fetch Papua New Guinea from world countries GeoJSON"""
    # Try DataHub countries dataset
    url = "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"
    
    try:
        print("Fetching Papua New Guinea boundaries from countries dataset...")
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode())
            
        # Find Papua New Guinea in the features
        for feature in data['features']:
            if 'properties' in feature:
                name = feature['properties'].get('NAME', '').lower()
                iso_code = feature['properties'].get('ISO_A3', '')
                
                if 'papua' in name or iso_code == 'PNG':
                    coords = feature['geometry']['coordinates']
                    print(f"✅ Papua New Guinea: Found geometry with {len(coords)} parts")
                    return coords
        
        print("❌ Papua New Guinea not found in countries dataset")
        return None
        
    except Exception as e:
        print(f"❌ Error fetching Papua New Guinea: {e}")
        return None

def update_map_with_real_boundaries():
    """Update map.geojson with real boundaries"""
    
    # Fetch real boundaries
    nc_coords = fetch_north_carolina_geojson()
    png_coords = fetch_papua_new_guinea_from_countries()
    
    if not nc_coords and not png_coords:
        print("❌ Failed to fetch any boundaries")
        return
    
    # Load current map
    try:
        with open('src/assets/data/map.geojson', 'r') as f:
            data = json.load(f)
    except Exception as e:
        print(f"❌ Error loading map.geojson: {e}")
        return
    
    # Update boundaries
    updated_count = 0
    
    for feature in data['features']:
        code = feature['properties']['locationCode']
        name = feature['properties']['name']
        
        if code == 'NCA' and nc_coords:
            feature['geometry'] = {
                'type': 'Polygon',
                'coordinates': nc_coords
            }
            print(f"✅ Updated {code} ({name}) with real North Carolina boundaries")
            updated_count += 1
            
        elif code == 'NWG' and png_coords:
            # Handle MultiPolygon or Polygon
            if isinstance(png_coords[0][0][0], list):
                # It's a MultiPolygon, take the main island
                main_island = max(png_coords, key=lambda poly: len(poly[0]))
                feature['geometry'] = {
                    'type': 'Polygon', 
                    'coordinates': main_island
                }
            else:
                # It's already a Polygon
                feature['geometry'] = {
                    'type': 'Polygon',
                    'coordinates': png_coords
                }
            print(f"✅ Updated {code} ({name}) with real Papua New Guinea boundaries")
            updated_count += 1
    
    if updated_count > 0:
        # Save updated map
        try:
            with open('src/assets/data/map.geojson', 'w') as f:
                json.dump(data, f, separators=(',', ':'))
            print(f"\n🎯 Successfully updated {updated_count} regions with real boundaries!")
        except Exception as e:
            print(f"❌ Error saving map.geojson: {e}")
    else:
        print("❌ No regions were updated")

if __name__ == '__main__':
    update_map_with_real_boundaries()