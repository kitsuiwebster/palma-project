#!/usr/bin/env python3
"""Get real boundaries for North Carolina from reliable sources"""

import json
import urllib.request
import urllib.error

def fetch_north_carolina_from_census():
    """Fetch North Carolina from US Census Bureau data"""
    url = "https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json"
    
    try:
        print(f"Fetching US states data from Census Bureau...")
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode())
            
        # Find North Carolina
        for feature in data['features']:
            if 'properties' in feature:
                name = feature['properties'].get('NAME', '').lower()
                name_alt = feature['properties'].get('name', '').lower()
                
                if 'north carolina' in name or 'north carolina' in name_alt:
                    coords = feature['geometry']['coordinates']
                    geom_type = feature['geometry']['type']
                    print(f"✅ Found North Carolina: {geom_type} with {len(coords)} parts")
                    return {
                        'type': geom_type,
                        'coordinates': coords
                    }
        
        print("❌ North Carolina not found in Census data")
        return None
        
    except Exception as e:
        print(f"❌ Error fetching Census data: {e}")
        return None

def fetch_north_carolina_from_alternative():
    """Fetch North Carolina from alternative US states GeoJSON"""
    url = "https://raw.githubusercontent.com/jgoodall/us-maps/master/geojson/state.geo.json"
    
    try:
        print(f"Fetching US states from alternative source...")
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode())
            
        # Find North Carolina
        for feature in data['features']:
            if 'properties' in feature:
                name = feature['properties'].get('NAME', '').lower()
                name_alt = feature['properties'].get('name', '').lower()
                state_abbr = feature['properties'].get('STATE_ABBR', '')
                
                if ('north carolina' in name or 
                    'north carolina' in name_alt or 
                    state_abbr == 'NC'):
                    coords = feature['geometry']['coordinates']
                    geom_type = feature['geometry']['type']
                    print(f"✅ Found North Carolina: {geom_type} with {len(coords)} parts")
                    return {
                        'type': geom_type,
                        'coordinates': coords
                    }
        
        print("❌ North Carolina not found in alternative source")
        return None
        
    except Exception as e:
        print(f"❌ Error fetching alternative data: {e}")
        return None

def fetch_north_carolina_from_github_repo():
    """Fetch North Carolina from GitHub US states repository"""
    url = "https://raw.githubusercontent.com/glynnbird/usstatesgeojson/master/north%20carolina.geojson"
    
    try:
        print(f"Fetching North Carolina from GitHub repository...")
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode())
            
        if 'geometry' in data and 'coordinates' in data['geometry']:
            coords = data['geometry']['coordinates']
            geom_type = data['geometry']['type']
            print(f"✅ Found North Carolina: {geom_type} with {len(coords[0])} coordinate points")
            return {
                'type': geom_type,
                'coordinates': coords
            }
        else:
            print("❌ Invalid GeoJSON structure from GitHub")
            return None
            
    except Exception as e:
        print(f"❌ Error fetching from GitHub: {e}")
        return None

def update_map_with_north_carolina():
    """Update map.geojson with real North Carolina boundaries"""
    
    # Try multiple sources for North Carolina boundaries
    print("=== Fetching North Carolina boundaries ===")
    
    nc_geometry = None
    
    # Try GitHub repository first (most specific)
    nc_geometry = fetch_north_carolina_from_github_repo()
    
    # If that fails, try Census Bureau data
    if not nc_geometry:
        nc_geometry = fetch_north_carolina_from_census()
    
    # If that fails, try alternative source
    if not nc_geometry:
        nc_geometry = fetch_north_carolina_from_alternative()
    
    if not nc_geometry:
        print("❌ Failed to fetch North Carolina boundaries from any source")
        return
    
    # Load current map
    try:
        with open('src/assets/data/map.geojson', 'r') as f:
            data = json.load(f)
    except Exception as e:
        print(f"❌ Error loading map.geojson: {e}")
        return
    
    # Update North Carolina boundaries
    updated_count = 0
    
    for feature in data['features']:
        code = feature['properties']['locationCode']
        name = feature['properties']['name']
        
        if code == 'NCA':
            # Update with real North Carolina boundaries
            feature['geometry'] = {
                'type': nc_geometry['type'],
                'coordinates': nc_geometry['coordinates']
            }
            feature['properties']['name'] = 'North Carolina'
            print(f"✅ Updated {code} ({name}) with real North Carolina boundaries")
            updated_count += 1
            break
    
    if updated_count > 0:
        # Save updated map
        try:
            with open('src/assets/data/map.geojson', 'w') as f:
                json.dump(data, f, separators=(',', ':'))
            print(f"\n🎯 Successfully updated North Carolina with REAL boundaries!")
            print("✅ NCA: Real North Carolina state boundaries from official US data")
        except Exception as e:
            print(f"❌ Error saving map.geojson: {e}")
    else:
        print("❌ North Carolina (NCA) not found in map data")

if __name__ == '__main__':
    update_map_with_north_carolina()