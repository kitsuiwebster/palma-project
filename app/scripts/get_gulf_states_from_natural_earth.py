#!/usr/bin/env python3
"""Get real boundaries for Gulf States and Oman from Natural Earth data"""

import json
import urllib.request
import urllib.error

def fetch_countries_from_natural_earth():
    """Fetch countries from Natural Earth 50m dataset"""
    url = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson"
    
    try:
        print(f"Fetching Natural Earth countries data...")
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode())
            
        # Target countries for Gulf States and Oman
        target_countries = {
            'Kuwait': ['KWT', 'kuwait'],
            'Bahrain': ['BHR', 'bahrain'], 
            'Qatar': ['QAT', 'qatar'],
            'United Arab Emirates': ['ARE', 'UAE', 'emirates'],
            'Oman': ['OMN', 'oman']
        }
        
        found_countries = {}
        
        # Find countries in the features
        for feature in data['features']:
            if 'properties' in feature:
                name = feature['properties'].get('NAME', '').lower()
                name_en = feature['properties'].get('NAME_EN', '').lower()
                iso_a3 = feature['properties'].get('ISO_A3', '')
                adm0_a3 = feature['properties'].get('ADM0_A3', '')
                
                # Check if this matches any of our target countries
                for country_name, identifiers in target_countries.items():
                    match_found = False
                    for identifier in identifiers:
                        if (identifier.lower() in name or 
                            identifier.lower() in name_en or 
                            identifier == iso_a3 or 
                            identifier == adm0_a3):
                            match_found = True
                            break
                    
                    if match_found:
                        coords = feature['geometry']['coordinates']
                        geom_type = feature['geometry']['type']
                        print(f"✅ Found {country_name}: {geom_type} with {len(coords)} parts")
                        found_countries[country_name] = {
                            'type': geom_type,
                            'coordinates': coords
                        }
                        break
        
        return found_countries
        
    except Exception as e:
        print(f"❌ Error fetching Natural Earth data: {e}")
        return {}

def combine_gulf_states_boundaries(countries_data):
    """Combine Gulf States into one MultiPolygon"""
    all_polygons = []
    
    gulf_states = ['Kuwait', 'Bahrain', 'Qatar', 'United Arab Emirates']
    
    for country_name in gulf_states:
        if country_name in countries_data:
            geom = countries_data[country_name]
            coords = geom['coordinates']
            
            if geom['type'] == 'MultiPolygon':
                # Already MultiPolygon, extend all parts
                all_polygons.extend(coords)
            elif geom['type'] == 'Polygon':
                # Single Polygon, add as one part
                all_polygons.append(coords)
    
    return all_polygons

def update_map_with_real_boundaries():
    """Update map.geojson with real Gulf States and Oman boundaries"""
    
    # Fetch all countries
    print("=== Fetching Gulf States and Oman boundaries ===")
    countries_data = fetch_countries_from_natural_earth()
    
    if not countries_data:
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
        
        if code == 'GST':
            # Combine all Gulf States into one MultiPolygon
            combined_polygons = combine_gulf_states_boundaries(countries_data)
            if combined_polygons:
                feature['geometry'] = {
                    'type': 'MultiPolygon',
                    'coordinates': combined_polygons
                }
                feature['properties']['name'] = 'Gulf States'
                print(f"✅ Updated {code} with combined Gulf States boundaries ({len(combined_polygons)} parts)")
                updated_count += 1
            
        elif code == 'OMA':
            # Set Oman boundaries
            if 'Oman' in countries_data:
                oman_geom = countries_data['Oman']
                feature['geometry'] = {
                    'type': oman_geom['type'],
                    'coordinates': oman_geom['coordinates']
                }
                feature['properties']['name'] = 'Oman'
                print(f"✅ Updated {code} with real Oman boundaries ({oman_geom['type']})")
                updated_count += 1
    
    if updated_count > 0:
        # Save updated map
        try:
            with open('src/assets/data/map.geojson', 'w') as f:
                json.dump(data, f, separators=(',', ':'))
            print(f"\n🎯 Successfully updated {updated_count} regions with REAL boundaries!")
            print("✅ GST: Real boundaries of Kuwait + Bahrain + Qatar + UAE")
            print("✅ OMA: Real boundaries of Oman")
            print("Sources: Natural Earth 50m Admin 0 Countries")
        except Exception as e:
            print(f"❌ Error saving map.geojson: {e}")
    else:
        print("❌ No regions were updated")

if __name__ == '__main__':
    update_map_with_real_boundaries()