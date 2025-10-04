#!/usr/bin/env python3
"""
Update map.geojson by combining all individual area GeoJSON files
"""
import json
import os
import glob

def main():
    print("🔄 Updating map.geojson from individual area files...")
    
    # Base directory
    areas_dir = "src/assets/data/areas"
    output_file = "src/assets/data/map.geojson"
    
    # Initialize the main GeoJSON structure
    main_geojson = {
        "type": "FeatureCollection",
        "features": []
    }
    
    # Find all GeoJSON files in areas directory
    geojson_files = glob.glob(os.path.join(areas_dir, "*.geojson"))
    
    if not geojson_files:
        print(f"❌ No GeoJSON files found in {areas_dir}")
        return
    
    print(f"📁 Found {len(geojson_files)} area files")
    
    # Process each GeoJSON file
    for file_path in sorted(geojson_files):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                area_data = json.load(f)
            
            # Add the feature to the main collection
            if area_data.get('type') == 'Feature':
                main_geojson['features'].append(area_data)
                location_code = area_data.get('properties', {}).get('locationCode', 'Unknown')
                name = area_data.get('properties', {}).get('name', 'Unknown')
                print(f"  ✅ Added {location_code}: {name}")
            else:
                print(f"  ⚠️  Skipped {file_path}: not a valid Feature")
                
        except Exception as e:
            print(f"  ❌ Error processing {file_path}: {e}")
    
    # Write the combined GeoJSON
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(main_geojson, f, separators=(',', ':'))
        
        print(f"✅ Successfully updated {output_file} with {len(main_geojson['features'])} features")
        
        # Show file size
        file_size = os.path.getsize(output_file) / (1024 * 1024)  # MB
        print(f"📊 File size: {file_size:.1f} MB")
        
    except Exception as e:
        print(f"❌ Error writing {output_file}: {e}")

if __name__ == "__main__":
    main()