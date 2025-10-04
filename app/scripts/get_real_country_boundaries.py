#!/usr/bin/env python3
"""Get real country boundaries from reliable sources"""

import json
import urllib.request
import urllib.error
import os

def fetch_country_from_natural_earth(iso_code, country_name):
    """Fetch country boundary from Natural Earth data"""
    # Try Natural Earth's countries dataset
    url = "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"
    
    try:
        print(f"Fetching {country_name} from Natural Earth data...")
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode())
            
        # Find the country in the features
        for feature in data['features']:
            props = feature.get('properties', {})
            
            # Check various name and code fields
            name = props.get('NAME', '').lower()
            name_long = props.get('NAME_LONG', '').lower()
            iso_a2 = props.get('ISO_A2', '')
            iso_a3 = props.get('ISO_A3', '')
            
            # Match by ISO code or name
            country_lower = country_name.lower()
            if (iso_a2 == iso_code[:2] or iso_a3 == iso_code or 
                country_lower in name or country_lower in name_long or
                name in country_lower):
                
                print(f"✅ Found {country_name}: {props.get('NAME', 'Unknown')}")
                return feature['geometry']
        
        print(f"❌ {country_name} not found in Natural Earth data")
        return None
        
    except Exception as e:
        print(f"❌ Error fetching {country_name}: {e}")
        return None

def fetch_from_restcountries(country_name):
    """Try alternative source - world atlas geojson"""
    # Alternative: Try world-atlas repository
    url = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"
    
    try:
        print(f"Trying alternative source for {country_name}...")
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode())
            
        # This is TopoJSON format, need different handling
        print(f"⚠️  Alternative source uses TopoJSON format, skipping for now")
        return None
        
    except Exception as e:
        print(f"❌ Alternative source failed for {country_name}: {e}")
        return None

def create_country_geojson(code, name, geometry, species_count):
    """Create a complete country GeoJSON file"""
    
    if not geometry:
        print(f"❌ No geometry available for {name}")
        return None
    
    geojson = {
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "properties": {
                "name": name,
                "locationCode": code,
                "speciesCount": species_count
            },
            "geometry": geometry
        }]
    }
    
    return geojson

def update_country_boundaries():
    """Update country boundaries with real data"""
    
    # Define countries to update with their codes and species counts
    countries = {
        'BRA': {'name': 'Brazil', 'iso': 'BRA', 'species': 428},
        'CHN': {'name': 'China', 'iso': 'CHN', 'species': 107}, 
        'MEX': {'name': 'Mexico', 'iso': 'MEX', 'species': 172},
        'ARG': {'name': 'Argentina', 'iso': 'ARG', 'species': 15}
    }
    
    geojson_dir = 'src/assets/data/areas/'
    updated_files = []
    
    for code, data in countries.items():
        print(f"\n--- Processing {data['name']} ({code}) ---")
        
        # Try to fetch real boundaries
        geometry = fetch_country_from_natural_earth(data['iso'], data['name'])
        
        if not geometry:
            # Try alternative source
            geometry = fetch_from_restcountries(data['name'])
        
        if geometry:
            # Create complete GeoJSON
            geojson = create_country_geojson(
                code, 
                data['name'], 
                geometry, 
                data['species']
            )
            
            if geojson:
                # Write to file
                filename = f"{code}_{data['name']}.geojson"
                filepath = os.path.join(geojson_dir, filename)
                
                try:
                    with open(filepath, 'w') as f:
                        json.dump(geojson, f, separators=(',', ':'))
                    
                    updated_files.append(filename)
                    print(f"✅ Updated {filename} with real boundaries")
                    
                    # Quick validation
                    coords_count = 0
                    if geometry['type'] == 'Polygon':
                        coords_count = len(geometry['coordinates'][0])
                    elif geometry['type'] == 'MultiPolygon':
                        coords_count = sum(len(poly[0]) for poly in geometry['coordinates'])
                    
                    print(f"   Geometry: {geometry['type']} with ~{coords_count} coordinate points")
                    
                except Exception as e:
                    print(f"❌ Error writing {filename}: {e}")
        else:
            print(f"❌ Could not fetch real boundaries for {data['name']}")
    
    print(f"\n🎯 Successfully updated {len(updated_files)} country files with real boundaries!")
    if updated_files:
        print("Updated files:")
        for filename in updated_files:
            print(f"  - {filename}")
    
    return updated_files

if __name__ == '__main__':
    update_country_boundaries()