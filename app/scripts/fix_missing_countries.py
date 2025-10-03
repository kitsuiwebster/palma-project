#!/usr/bin/env python3
"""Fix missing Argentina and China entries in map.geojson"""

import json

def get_species_counts():
    """Calculate species counts for Argentina and China"""
    argentina_count = 12  # from our analysis
    china_count = 71      # from our analysis
    return argentina_count, china_count

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

def create_country_entries():
    """Create Argentina and China country entries with basic geometries"""
    
    argentina_count, china_count = get_species_counts()
    
    # Simple geometric approximations for Argentina and China
    # These are very basic rectangles that cover the approximate area
    # In a real application, you'd use proper country boundary data
    
    argentina_feature = {
        "type": "Feature",
        "properties": {
            "name": "Argentina",
            "locationCode": "ARG",
            "speciesCount": argentina_count,
            "densityZone": determine_density_zone(argentina_count),
            "color": get_color(argentina_count),
            "isPalmZone": True,
            "subdivisions": [
                {"code": "AGE", "name": "Argentina East", "species": 8},
                {"code": "AGW", "name": "Argentina West", "species": 4}
            ]
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [-73.5, -21.8],  # NW corner
                [-53.6, -21.8],  # NE corner  
                [-53.6, -55.1],  # SE corner
                [-73.5, -55.1],  # SW corner
                [-73.5, -21.8]   # back to start
            ]]
        }
    }
    
    china_feature = {
        "type": "Feature",
        "properties": {
            "name": "China",
            "locationCode": "CHN",
            "speciesCount": china_count,
            "densityZone": determine_density_zone(china_count),
            "color": get_color(china_count),
            "isPalmZone": True,
            "subdivisions": [
                {"code": "CHC", "name": "China Central", "species": 25},
                {"code": "CHH", "name": "China South Central", "species": 20},
                {"code": "CHS", "name": "China South", "species": 20},
                {"code": "CHT", "name": "China Tibet", "species": 6}
            ]
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [73.5, 53.5],   # NW corner
                [134.8, 53.5],  # NE corner
                [134.8, 18.2],  # SE corner
                [73.5, 18.2],   # SW corner
                [73.5, 53.5]    # back to start
            ]]
        }
    }
    
    return argentina_feature, china_feature

def fix_map():
    """Add missing Argentina and China entries to map.geojson"""
    
    # Load existing map
    with open('src/assets/data/map.geojson', 'r') as f:
        map_data = json.load(f)
    
    # Get new country features
    argentina_feature, china_feature = create_country_entries()
    
    # Check if Argentina and China already exist
    existing_codes = {feature['properties']['locationCode'] for feature in map_data['features']}
    
    if 'ARG' not in existing_codes:
        map_data['features'].append(argentina_feature)
        print(f"Added Argentina with {argentina_feature['properties']['speciesCount']} species")
    
    if 'CHN' not in existing_codes:
        map_data['features'].append(china_feature)
        print(f"Added China with {china_feature['properties']['speciesCount']} species")
    
    # Save updated map
    with open('src/assets/data/map.geojson', 'w') as f:
        json.dump(map_data, f, indent=2)
    
    print(f"Updated map now has {len(map_data['features'])} features")

if __name__ == '__main__':
    fix_map()