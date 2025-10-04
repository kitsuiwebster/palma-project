#!/usr/bin/env python3
"""Get better country boundaries from multiple sources"""

import json
import urllib.request
import urllib.error
import os

def try_restcountries_api(country_name, iso_code):
    """Try REST Countries API for specific country data"""
    
    # Try different REST Countries endpoints
    urls = [
        f"https://restcountries.com/v3.1/alpha/{iso_code.lower()}",
        f"https://restcountries.com/v3.1/name/{country_name.lower()}"
    ]
    
    for url in urls:
        try:
            print(f"Trying REST Countries API: {url}")
            with urllib.request.urlopen(url) as response:
                data = json.loads(response.read().decode())
                
            if data and len(data) > 0:
                country_info = data[0]
                print(f"✅ Found {country_name} via REST Countries API")
                # This API doesn't provide GeoJSON boundaries, just country info
                return None
                
        except Exception as e:
            print(f"❌ REST Countries failed: {e}")
            continue
    
    return None

def try_github_geojson_sources(country_name, iso_code):
    """Try various GitHub sources for country GeoJSON"""
    
    # Various GitHub repositories with country data
    sources = [
        {
            'name': 'Natural Earth via D3',
            'url': 'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson',
            'name_field': 'NAME'
        },
        {
            'name': 'Countries GeoJSON', 
            'url': 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson',
            'name_field': 'ADMIN'
        },
        {
            'name': 'World Atlas',
            'url': 'https://raw.githubusercontent.com/topojson/world-atlas/master/countries-110m.json',
            'format': 'topojson'
        }
    ]
    
    for source in sources:
        if source.get('format') == 'topojson':
            continue  # Skip TopoJSON for now
            
        try:
            print(f"Trying {source['name']}...")
            with urllib.request.urlopen(source['url']) as response:
                data = json.loads(response.read().decode())
            
            # Search for the country
            for feature in data['features']:
                props = feature.get('properties', {})
                
                # Check various name fields
                names_to_check = [
                    props.get('NAME', ''),
                    props.get('NAME_LONG', ''),
                    props.get('ADMIN', ''),
                    props.get('NAME_EN', ''),
                    props.get('SOVEREIGNT', '')
                ]
                
                # Check ISO codes
                iso_codes = [
                    props.get('ISO_A2', ''),
                    props.get('ISO_A3', ''),
                    props.get('ADM0_A3', '')
                ]
                
                # Match by name or ISO code
                country_lower = country_name.lower()
                for name in names_to_check:
                    if name and (country_lower in name.lower() or name.lower() in country_lower):
                        print(f"✅ Found {country_name} in {source['name']}: {name}")
                        return feature['geometry']
                
                for code in iso_codes:
                    if code and code.upper() == iso_code.upper():
                        print(f"✅ Found {country_name} by ISO code in {source['name']}")
                        return feature['geometry']
            
            print(f"❌ {country_name} not found in {source['name']}")
            
        except Exception as e:
            print(f"❌ Error with {source['name']}: {e}")
    
    return None

def try_specific_country_repos(country_name, iso_code):
    """Try country-specific repositories"""
    
    # GitHub repos with detailed country boundaries
    specific_sources = {
        'brazil': 'https://raw.githubusercontent.com/tbrugz/geodata-br/master/geojson/geojs-brazil.json',
        'china': 'https://raw.githubusercontent.com/clemsos/china-geojson/master/china.geojson',
        'mexico': 'https://raw.githubusercontent.com/talos/geojson-countries/master/MEX.geojson',
        'argentina': 'https://raw.githubusercontent.com/talos/geojson-countries/master/ARG.geojson'
    }
    
    country_key = country_name.lower()
    if country_key in specific_sources:
        url = specific_sources[country_key]
        
        try:
            print(f"Trying specific repo for {country_name}...")
            with urllib.request.urlopen(url) as response:
                data = json.loads(response.read().decode())
            
            # Handle different formats
            if 'features' in data:
                # FeatureCollection
                if data['features']:
                    print(f"✅ Found {country_name} from specific repo (FeatureCollection)")
                    return data['features'][0]['geometry']
            elif 'coordinates' in data:
                # Direct geometry
                print(f"✅ Found {country_name} from specific repo (Geometry)")
                return data
            elif 'geometry' in data:
                # Feature
                print(f"✅ Found {country_name} from specific repo (Feature)")
                return data['geometry']
                
        except Exception as e:
            print(f"❌ Specific repo failed for {country_name}: {e}")
    
    return None

def get_country_geometry(country_name, iso_code):
    """Try multiple sources to get country geometry"""
    
    print(f"\n=== Getting geometry for {country_name} ({iso_code}) ===")
    
    # Try sources in order of preference
    sources = [
        try_specific_country_repos,
        try_github_geojson_sources,
        try_restcountries_api
    ]
    
    for source_func in sources:
        geometry = source_func(country_name, iso_code)
        if geometry:
            return geometry
    
    print(f"❌ Could not find geometry for {country_name}")
    return None

def update_countries_with_real_boundaries():
    """Update all country files with real boundaries"""
    
    countries = {
        'BRA': {'name': 'Brazil', 'iso': 'BRA', 'species': 428},
        'CHN': {'name': 'China', 'iso': 'CHN', 'species': 107}, 
        'MEX': {'name': 'Mexico', 'iso': 'MEX', 'species': 172},
        'ARG': {'name': 'Argentina', 'iso': 'ARG', 'species': 15}
    }
    
    geojson_dir = 'src/assets/data/areas/'
    updated_files = []
    
    for code, data in countries.items():
        geometry = get_country_geometry(data['name'], data['iso'])
        
        if geometry:
            # Create GeoJSON
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
            
            # Save file
            filename = f"{code}_{data['name']}.geojson"
            filepath = os.path.join(geojson_dir, filename)
            
            try:
                with open(filepath, 'w') as f:
                    json.dump(geojson, f, separators=(',', ':'))
                
                updated_files.append(filename)
                print(f"✅ Updated {filename}")
                
                # Show geometry info
                geom_type = geometry.get('type', 'Unknown')
                if geom_type == 'Polygon':
                    coord_count = len(geometry['coordinates'][0]) if geometry['coordinates'] else 0
                elif geom_type == 'MultiPolygon':
                    coord_count = sum(len(poly[0]) for poly in geometry['coordinates']) if geometry['coordinates'] else 0
                else:
                    coord_count = 0
                
                print(f"   Type: {geom_type}, Coordinates: ~{coord_count}")
                
            except Exception as e:
                print(f"❌ Error saving {filename}: {e}")
    
    print(f"\n🎯 Successfully updated {len(updated_files)} countries!")
    return updated_files

if __name__ == '__main__':
    update_countries_with_real_boundaries()