#!/usr/bin/env python3
"""
Update map.geojson by rebuilding it from individual area files and current dataset
This script counts species per region from the dataset and combines with geographic boundaries
"""

import json
import os
import sys
from collections import defaultdict

def load_dataset():
    """Load the current dataset and count species per region"""
    dataset_path = 'src/assets/data/dataset.txt'
    
    if not os.path.exists(dataset_path):
        print(f"❌ Dataset not found at {dataset_path}")
        return {}
    
    region_species_count = defaultdict(int)
    
    try:
        with open(dataset_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        # Skip header line
        for i, line in enumerate(lines[1:], 1):
            parts = line.strip().split('\t')
            if len(parts) >= 6:  # Make sure we have the NativeRegion column
                native_regions = parts[5]  # Column 6 (0-indexed 5) is NativeRegion
                
                if native_regions and native_regions.strip():
                    # Split multiple regions (separated by comma and space)
                    regions = [r.strip() for r in native_regions.split(',')]
                    
                    for region in regions:
                        if region:  # Skip empty regions
                            region_species_count[region] += 1
        
        print(f"✅ Loaded dataset: {len(lines)-1} species, {len(region_species_count)} regions with species")
        return dict(region_species_count)
        
    except Exception as e:
        print(f"❌ Error loading dataset: {e}")
        return {}

def load_areas_geojson():
    """Load all individual area GeoJSON files"""
    areas_dir = 'src/assets/data/areas'
    
    if not os.path.exists(areas_dir):
        print(f"❌ Areas directory not found at {areas_dir}")
        return []
    
    features = []
    
    for filename in os.listdir(areas_dir):
        if filename.endswith('.geojson'):
            filepath = os.path.join(areas_dir, filename)
            
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                if 'features' in data:
                    features.extend(data['features'])
                elif 'type' in data and data['type'] == 'Feature':
                    features.append(data)
                
            except Exception as e:
                print(f"⚠️  Error loading {filename}: {e}")
    
    print(f"✅ Loaded {len(features)} geographic features from {areas_dir}")
    return features

def get_density_zone_and_color(species_count):
    """Get density zone name and color based on species count"""
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

def build_map_geojson():
    """Build the main map.geojson from areas and dataset"""
    
    print("=== Building map.geojson ===")
    
    # Load dataset species counts
    species_counts = load_dataset()
    
    # Load geographic features
    features = load_areas_geojson()
    
    if not features:
        print("❌ No geographic features found")
        return False
    
    # Update features with species data
    updated_features = []
    missing_regions = set()
    
    for feature in features:
        if 'properties' not in feature:
            feature['properties'] = {}
        
        # Get location code (should be in properties)
        location_code = feature['properties'].get('locationCode', '')
        
        if not location_code:
            print(f"⚠️  Feature missing locationCode: {feature['properties']}")
            continue
        
        # Get species count for this region
        species_count = species_counts.get(location_code, 0)
        
        if species_count == 0 and location_code in ['CHC', 'CHH', 'CHS', 'CHT', 'AGE', 'AGW', 'BZC', 'BZE', 'BZL', 'BZN', 'BZS', 'MXC', 'MXE', 'MXG', 'MXI', 'MXN', 'MXS', 'MXT']:
            missing_regions.add(location_code)
        
        # Get density zone and color
        density_zone, color = get_density_zone_and_color(species_count)
        
        # Update properties
        feature['properties']['speciesCount'] = species_count
        feature['properties']['densityZone'] = density_zone
        feature['properties']['color'] = color
        feature['properties']['isPalmZone'] = species_count > 0
        
        updated_features.append(feature)
    
    # Report missing regions
    if missing_regions:
        print(f"⚠️  Important regions with 0 species: {sorted(missing_regions)}")
    
    # Create the final GeoJSON
    map_geojson = {
        "type": "FeatureCollection",
        "features": updated_features
    }
    
    # Save to map.geojson
    output_path = 'src/assets/data/map.geojson'
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(map_geojson, f, separators=(',', ':'))
        
        print(f"✅ Saved map.geojson with {len(updated_features)} features")
        
        # Summary statistics
        total_species_in_map = sum(f['properties']['speciesCount'] for f in updated_features)
        regions_with_species = sum(1 for f in updated_features if f['properties']['speciesCount'] > 0)
        
        print(f"📊 Map summary:")
        print(f"   • Total features: {len(updated_features)}")
        print(f"   • Regions with species: {regions_with_species}")
        print(f"   • Total species placements: {total_species_in_map}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error saving map.geojson: {e}")
        return False

def main():
    """Main function"""
    if len(sys.argv) > 1 and sys.argv[1] == '--check':
        # Just check current status
        species_counts = load_dataset()
        print("Top regions by species count:")
        sorted_regions = sorted(species_counts.items(), key=lambda x: x[1], reverse=True)
        for region, count in sorted_regions[:10]:
            print(f"  {region}: {count} species")
    else:
        # Build the map
        success = build_map_geojson()
        if success:
            print("\n🎯 Map update completed successfully!")
        else:
            print("\n❌ Map update failed!")
            sys.exit(1)

if __name__ == '__main__':
    main()