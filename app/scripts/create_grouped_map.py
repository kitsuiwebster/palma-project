#!/usr/bin/env python3
"""
Script to create a grouped version of map.geojson where country subdivisions
are aggregated by main country for better map visualization.
"""

import json
import re
from collections import defaultdict

def load_region_codes():
    """Load the region codes mapping."""
    with open('src/assets/data/region_codes.json', 'r') as f:
        return json.load(f)

def get_main_country_mapping():
    """Create mapping from subdivision codes to main countries."""
    region_codes = load_region_codes()
    
    # Direct mapping by codes instead of name pattern matching
    mapping = {}
    
    # Brazil subdivisions
    brazil_codes = ['BZC', 'BZE', 'BZL', 'BZN', 'BZS']
    for code in brazil_codes:
        if code in region_codes:
            mapping[code] = {
                'main_country': 'Brazil',
                'flag': 'https://flagcdn.com/w20/br.png',
                'country_code': 'BRA',
                'subdivision_name': region_codes[code]['name']
            }
    
    # Argentina subdivisions  
    argentina_codes = ['AGE', 'AGW']
    for code in argentina_codes:
        if code in region_codes:
            mapping[code] = {
                'main_country': 'Argentina',
                'flag': 'https://flagcdn.com/w20/ar.png', 
                'country_code': 'ARG',
                'subdivision_name': region_codes[code]['name']
            }
    
    # China subdivisions
    china_codes = ['CHC', 'CHH', 'CHS', 'CHT']
    for code in china_codes:
        if code in region_codes:
            mapping[code] = {
                'main_country': 'China',
                'flag': 'https://flagcdn.com/w20/cn.png',
                'country_code': 'CHN', 
                'subdivision_name': region_codes[code]['name']
            }
    
    # Mexico subdivisions
    mexico_codes = ['MXC', 'MXE', 'MXG', 'MXI', 'MXN', 'MXS', 'MXT']
    for code in mexico_codes:
        if code in region_codes:
            mapping[code] = {
                'main_country': 'Mexico',
                'flag': 'https://flagcdn.com/w20/mx.png',
                'country_code': 'MEX',
                'subdivision_name': region_codes[code]['name']
            }
    
    # DON'T group US states - keep them separate
    
    return mapping

def aggregate_country_data(features, country_mapping):
    """Aggregate subdivision features by main country."""
    
    country_aggregates = defaultdict(lambda: {
        'name': '',
        'locationCode': '',
        'speciesCount': 0,
        'geometries': [],
        'flag': '',
        'subdivisions': []
    })
    
    ungrouped_features = []
    
    for feature in features:
        location_code = feature['properties']['locationCode']
        
        if location_code in country_mapping:
            # This is a subdivision that should be grouped
            main_country = country_mapping[location_code]['main_country']
            country_data = country_aggregates[main_country]
            
            # Aggregate species count
            country_data['speciesCount'] += feature['properties']['speciesCount']
            
            # Store geometry
            country_data['geometries'].append(feature['geometry'])
            
            # Set country info
            country_data['name'] = main_country
            country_data['locationCode'] = country_mapping[location_code]['country_code']
            country_data['flag'] = country_mapping[location_code]['flag']
            country_data['subdivisions'].append({
                'code': location_code,
                'name': country_mapping[location_code]['subdivision_name'],
                'species': feature['properties']['speciesCount']
            })
            
        else:
            # Keep as-is for non-subdivided countries
            ungrouped_features.append(feature)
    
    return country_aggregates, ungrouped_features

def determine_density_zone(species_count):
    """Determine density zone based on species count."""
    if species_count > 150:
        return "Very High Density"
    elif species_count > 100:
        return "High Density" 
    elif species_count > 50:
        return "Medium Density"
    elif species_count > 10:
        return "Low Density"
    else:
        return "Very Low Density"

def get_color(species_count):
    """Get color based on species count."""
    if species_count > 150:
        return '#660000'  # very dark red
    elif species_count > 100:
        return '#A52A2A'  # brown red
    elif species_count > 50:
        return '#CD5C5C'  # indian red
    elif species_count > 10:
        return '#F4A460'  # sandy brown
    elif species_count > 5:
        return '#FFF8DC'  # cornsilk
    else:
        return '#FFFFE0'  # pale yellow

def create_grouped_geojson():
    """Create a new GeoJSON with grouped countries."""
    
    # Load original map data
    with open('src/assets/data/oldmap.geojson', 'r') as f:
        original_data = json.load(f)
    
    # Get country mapping
    country_mapping = get_main_country_mapping()
    
    # Aggregate data
    country_aggregates, ungrouped_features = aggregate_country_data(
        original_data['features'], country_mapping
    )
    
    # Create new features list
    new_features = []
    
    # Add ungrouped features
    new_features.extend(ungrouped_features)
    
    # Add aggregated country features
    for main_country, data in country_aggregates.items():
        
        # Create MultiPolygon geometry from all subdivisions
        if len(data['geometries']) == 1:
            geometry = data['geometries'][0]
        else:
            # Combine multiple geometries into MultiPolygon
            coordinates = []
            for geom in data['geometries']:
                if geom['type'] == 'Polygon':
                    coordinates.append(geom['coordinates'])
                elif geom['type'] == 'MultiPolygon':
                    coordinates.extend(geom['coordinates'])
            
            geometry = {
                'type': 'MultiPolygon',
                'coordinates': coordinates
            }
        
        # Create feature
        feature = {
            'type': 'Feature',
            'properties': {
                'name': data['name'],
                'locationCode': data['locationCode'],
                'speciesCount': data['speciesCount'],
                'densityZone': determine_density_zone(data['speciesCount']),
                'color': get_color(data['speciesCount']),
                'isPalmZone': True,
                'subdivisions': data['subdivisions']
            },
            'geometry': geometry
        }
        
        new_features.append(feature)
    
    # Create new GeoJSON
    new_geojson = {
        'type': 'FeatureCollection',
        'features': new_features
    }
    
    # Save grouped version
    with open('src/assets/data/map.geojson', 'w') as f:
        json.dump(new_geojson, f)
    
    # Print summary
    print(f"Created grouped map with {len(new_features)} features")
    print(f"Grouped countries: {len(country_aggregates)}")
    
    for country, data in country_aggregates.items():
        print(f"  {country}: {data['speciesCount']} species from {len(data['subdivisions'])} subdivisions")
        for sub in data['subdivisions']:
            print(f"    - {sub['name']}: {sub['species']} species")

if __name__ == '__main__':
    create_grouped_geojson()