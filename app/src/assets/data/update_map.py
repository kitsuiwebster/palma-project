#!/usr/bin/env python3
"""
Update map.geojson from individual area files and location.csv
Creates unified country totals from subdivisions (ARG = AGE+AGW, etc.)
"""

import json
import csv
import os
from collections import defaultdict

def load_area_data():
    """Load species counts per region from areas.csv"""
    areas_path = 'areas.csv'
    
    if not os.path.exists(areas_path):
        print(f"❌ areas.csv not found")
        return {}
    
    region_species = {}
    
    try:
        with open(areas_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                area_code = row.get('AreaCode', '').strip()
                species_count = row.get('SpeciesCount', '0').strip()
                
                if area_code and species_count:
                    region_species[area_code] = int(species_count)
        
        print(f"✅ Loaded {len(region_species)} regions from areas.csv")
        
        # Show top regions for verification
        sorted_regions = sorted(region_species.items(), key=lambda x: x[1], reverse=True)
        print("Top 5 regions by species count:")
        for code, count in sorted_regions[:5]:
            print(f"  {code}: {count} species")
            
        return region_species
        
    except Exception as e:
        print(f"❌ Error loading areas.csv: {e}")
        return {}

def calculate_unified_countries(region_species):
    """Calculate unified country totals from subdivisions"""
    
    # Define subdivision mappings
    country_subdivisions = {
        'ARG': ['AGE', 'AGW'],  # Argentina = East + West
        'BRA': ['BZC', 'BZE', 'BZL', 'BZN', 'BZS'],  # Brazil = Central + East + Southeast + North + South
        'CHN': ['CHC', 'CHH', 'CHS', 'CHT'],  # China = Central + South Central + South + Tibet
        'MEX': ['MXC', 'MXE', 'MXG', 'MXI', 'MXN', 'MXS', 'MXT'],  # Mexico = Central + East + Gulf + Islands + North + South + Southeast
        'IDN': ['JAW', 'LSI', 'MOL', 'SUL', 'SUM'],  # Indonesia = Java + Lesser Sunda + Moluccas + Sulawesi + Sumatra
        # 'MLY': ['BOR']  # Malaysia already includes Borneo in areas.csv, no need to add
    }
    
    unified_totals = {}
    
    # Don't calculate unified countries - just use the values from areas.csv as they are
    # This way IDN stays 521, MLY stays 481, etc.
    print("  Using original values from areas.csv (no subdivision calculation needed)")
    
    return unified_totals

def load_area_geojson_files():
    """Load all GeoJSON files from areas/ directory"""
    areas_dir = 'areas'
    
    if not os.path.exists(areas_dir):
        print(f"❌ areas/ directory not found")
        return {}
    
    geojson_features = {}
    
    for filename in os.listdir(areas_dir):
        if filename.endswith('.geojson'):
            # Extract code from filename (e.g., AGE_Argentina_East.geojson -> AGE)
            code = filename.split('_')[0]
            filepath = os.path.join(areas_dir, filename)
            
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # Extract the feature
                if 'features' in data and len(data['features']) > 0:
                    feature = data['features'][0]
                elif 'type' in data and data['type'] == 'Feature':
                    feature = data
                else:
                    print(f"⚠️  Invalid GeoJSON structure in {filename}")
                    continue
                
                geojson_features[code] = feature
                
            except Exception as e:
                print(f"⚠️  Error loading {filename}: {e}")
    
    print(f"✅ Loaded {len(geojson_features)} GeoJSON features from areas/")
    return geojson_features

def get_density_zone_and_color(species_count):
    """Get density zone and color based on species count"""
    if species_count >= 301:
        return "Exceptional Diversity", "#990000"
    elif species_count >= 201:
        return "Extremely High Diversity", "#cc3300"
    elif species_count >= 151:
        return "Very High Diversity", "#e65500"
    elif species_count >= 101:
        return "High Diversity", "#ff6600"
    elif species_count >= 61:
        return "Medium-High Diversity", "#ff9933"
    elif species_count >= 31:
        return "Medium Diversity", "#ffcc33"
    elif species_count >= 16:
        return "Medium-Low Diversity", "#ffe066"
    elif species_count >= 6:
        return "Low Diversity", "#fff2aa"
    elif species_count >= 1:
        return "Very Low Diversity", "#ffffcc"
    else:
        return "No Data", "#f0f0f0"

def create_map_geojson():
    """Create map.geojson from areas and location data"""
    
    print("=== Creating map.geojson ===")
    
    # Load data
    region_species = load_area_data()
    if not region_species:
        return False
    
    # Use species data as-is from areas.csv
    print("\\nUsing species data from areas.csv as-is")
    all_species_data = region_species
    
    # Load GeoJSON features
    geojson_features = load_area_geojson_files()
    if not geojson_features:
        return False
    
    # Build features for the map
    map_features = []
    
    for code, species_count in all_species_data.items():
        if code in geojson_features:
            feature = geojson_features[code].copy()
            
            # Update properties
            if 'properties' not in feature:
                feature['properties'] = {}
            
            density_zone, color = get_density_zone_and_color(species_count)
            
            feature['properties']['locationCode'] = code
            feature['properties']['speciesCount'] = species_count
            feature['properties']['densityZone'] = density_zone
            feature['properties']['color'] = color
            feature['properties']['isPalmZone'] = species_count > 0
            
            map_features.append(feature)
        else:
            print(f"⚠️  No GeoJSON found for {code} ({species_count} species)")
    
    # Create the final map
    map_geojson = {
        "type": "FeatureCollection",
        "features": map_features
    }
    
    # Save to map.geojson
    try:
        with open('map.geojson', 'w', encoding='utf-8') as f:
            json.dump(map_geojson, f, separators=(',', ':'))
        
        print(f"\\n✅ Created map.geojson with {len(map_features)} features")
        
        # Summary
        total_species_placements = sum(f['properties']['speciesCount'] for f in map_features)
        regions_with_species = sum(1 for f in map_features if f['properties']['speciesCount'] > 0)
        
        print(f"📊 Map summary:")
        print(f"   • Total features: {len(map_features)}")
        print(f"   • Regions with species: {regions_with_species}")
        print(f"   • Total species placements: {total_species_placements}")
        
        # Show top regions
        sorted_features = sorted(map_features, key=lambda x: x['properties']['speciesCount'], reverse=True)
        print(f"\\n🏆 Top 10 regions:")
        for feature in sorted_features[:10]:
            code = feature['properties']['locationCode']
            name = feature['properties'].get('name', code)
            count = feature['properties']['speciesCount']
            print(f"   {code}: {name} - {count} species")
        
        return True
        
    except Exception as e:
        print(f"❌ Error saving map.geojson: {e}")
        return False

if __name__ == '__main__':
    success = create_map_geojson()
    if success:
        print("\\n🎯 Map creation completed successfully!")
    else:
        print("\\n❌ Map creation failed!")
        exit(1)