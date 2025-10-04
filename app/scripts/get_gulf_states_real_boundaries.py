#!/usr/bin/env python3
"""Get real boundaries for Gulf States and Oman from reliable sources"""

import json
import urllib.request
import urllib.error

def fetch_country_from_world_geojson(country_names, iso_codes):
    """Fetch countries from world countries GeoJSON"""
    url = "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"
    
    try:
        print(f"Fetching world countries data from {url}...")
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode())
            
        found_countries = {}
        
        # Find countries in the features
        for feature in data['features']:
            if 'properties' in feature:
                name = feature['properties'].get('NAME', '').lower()
                iso_code = feature['properties'].get('ISO_A3', '')
                
                # Check if this is one of our target countries
                for target_name, target_iso in zip(country_names, iso_codes):
                    if target_name.lower() in name or iso_code == target_iso:
                        coords = feature['geometry']['coordinates']
                        print(f"✅ Found {target_name}: {len(coords)} parts")
                        found_countries[target_name] = coords
                        break
        
        return found_countries
        
    except Exception as e:
        print(f"❌ Error fetching world countries: {e}")
        return {}

def combine_gulf_states_boundaries(countries_data):
    """Combine multiple countries into one MultiPolygon for Gulf States"""
    all_polygons = []
    
    for country_name, coords in countries_data.items():
        if isinstance(coords[0][0][0], list):
            # It's already a MultiPolygon
            all_polygons.extend(coords)
        else:
            # It's a single Polygon
            all_polygons.append(coords)
    
    return all_polygons

def update_map_with_gulf_boundaries():
    """Update map.geojson with real Gulf States and Oman boundaries"""
    
    # Countries to fetch
    gulf_countries = ['Kuwait', 'Bahrain', 'Qatar', 'United Arab Emirates']
    gulf_iso_codes = ['KWT', 'BHR', 'QAT', 'ARE']
    
    other_countries = ['Oman']
    other_iso_codes = ['OMN']
    
    # Fetch Gulf States
    print("=== Fetching Gulf States boundaries ===")
    gulf_data = fetch_country_from_world_geojson(gulf_countries, gulf_iso_codes)
    
    # Fetch Oman
    print("\n=== Fetching Oman boundaries ===")
    oman_data = fetch_country_from_world_geojson(other_countries, other_iso_codes)
    
    if not gulf_data and not oman_data:
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
        
        if code == 'GST' and gulf_data:
            # Combine all Gulf States into one MultiPolygon
            combined_polygons = combine_gulf_states_boundaries(gulf_data)
            feature['geometry'] = {
                'type': 'MultiPolygon',
                'coordinates': combined_polygons
            }
            feature['properties']['name'] = 'Gulf States'
            print(f"✅ Updated {code} ({name}) with combined Gulf States boundaries ({len(combined_polygons)} parts)")
            updated_count += 1
            
        elif code == 'OMA' and 'Oman' in oman_data:
            # Set Oman boundaries
            oman_coords = oman_data['Oman']
            if isinstance(oman_coords[0][0][0], list):
                # It's a MultiPolygon
                feature['geometry'] = {
                    'type': 'MultiPolygon',
                    'coordinates': oman_coords
                }
            else:
                # It's a Polygon
                feature['geometry'] = {
                    'type': 'Polygon',
                    'coordinates': oman_coords
                }
            feature['properties']['name'] = 'Oman'
            print(f"✅ Updated {code} ({name}) with real Oman boundaries")
            updated_count += 1
    
    if updated_count > 0:
        # Save updated map
        try:
            with open('src/assets/data/map.geojson', 'w') as f:
                json.dump(data, f, separators=(',', ':'))
            print(f"\n🎯 Successfully updated {updated_count} regions with REAL boundaries!")
            print("✅ GST: Kuwait + Bahrain + Qatar + UAE combined")
            print("✅ OMA: Real Oman boundaries from official data")
        except Exception as e:
            print(f"❌ Error saving map.geojson: {e}")
    else:
        print("❌ No regions were updated")

if __name__ == '__main__':
    update_map_with_gulf_boundaries()