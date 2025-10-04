#!/usr/bin/env python3
"""Organize map.geojson into separate files by region type for easier management"""

import json
import os
from collections import defaultdict

def organize_geojson_regions():
    """Extract each region into separate organized GeoJSON files"""
    
    # Load the main map
    print("Loading main map.geojson...")
    try:
        with open('src/assets/data/map.geojson', 'r') as f:
            data = json.load(f)
    except Exception as e:
        print(f"❌ Error loading map.geojson: {e}")
        return
    
    # Create organized directory structure
    base_dir = 'src/assets/data/geojsons_organized'
    os.makedirs(base_dir, exist_ok=True)
    
    # Organize by region types
    regions_by_type = {
        'countries': [],
        'us_states': [],
        'islands': [],
        'regions': [],
        'subdivisions': []
    }
    
    # Region classifications
    us_states = ['ALA', 'ARI', 'ARK', 'CAL', 'FLA', 'GEO', 'HAW', 'LOU', 'NCA', 'OKL', 'SCA', 'TEX']
    islands = ['BAH', 'BER', 'CAY', 'COM', 'COO', 'CUB', 'DOM', 'FIJ', 'HAI', 'JAM', 'MDG', 'MAU', 'MRQ', 'NFK', 'PHI', 'PUE', 'REU', 'ROD', 'SAM', 'SEY', 'SOL', 'SRL', 'TAI', 'TOK', 'TON', 'TRT', 'TVL', 'VAN']
    subdivisions = ['AGE', 'AGW', 'BZC', 'BZE', 'BZL', 'BZN', 'BZS', 'CHC', 'CHH', 'CHS', 'CHT', 'MXC', 'MXE', 'MXG', 'MXI', 'MXN', 'MXS', 'MXT']
    regions = ['GST', 'WHM', 'EHM', 'MSI', 'LSI', 'WIN', 'LEE', 'SWC', 'EAI', 'GGI']
    
    # Process each feature
    region_count = defaultdict(int)
    
    for feature in data['features']:
        code = feature['properties']['locationCode']
        name = feature['properties']['name']
        
        # Determine category
        if code in us_states:
            category = 'us_states'
        elif code in islands:
            category = 'islands'
        elif code in subdivisions:
            category = 'subdivisions'
        elif code in regions:
            category = 'regions'
        else:
            category = 'countries'
        
        # Add to appropriate category
        regions_by_type[category].append(feature)
        region_count[category] += 1
        
        # Also save individual file
        individual_file = os.path.join(base_dir, 'individual', f'{code}_{name.replace(" ", "_").replace("/", "_")}.geojson')
        os.makedirs(os.path.dirname(individual_file), exist_ok=True)
        
        individual_geojson = {
            "type": "FeatureCollection",
            "features": [feature]
        }
        
        with open(individual_file, 'w') as f:
            json.dump(individual_geojson, f, separators=(',', ':'))
    
    # Save organized collections
    for category, features in regions_by_type.items():
        if features:
            collection = {
                "type": "FeatureCollection",
                "features": features
            }
            
            filename = os.path.join(base_dir, f'{category}.geojson')
            with open(filename, 'w') as f:
                json.dump(collection, f, separators=(',', ':'))
            
            print(f"✅ Created {category}.geojson with {len(features)} regions")
    
    # Create index file
    index_data = {
        "summary": {
            "total_regions": sum(region_count.values()),
            "by_category": dict(region_count)
        },
        "categories": {
            "countries": "Independent countries (AFG, ALG, BRA, etc.)",
            "us_states": "US states (ALA, CAL, FLA, GEO, etc.)",
            "islands": "Islands and island nations (BAH, CUB, MDG, PHI, etc.)",
            "subdivisions": "Country subdivisions (AGE/AGW=Argentina, CHC/CHH/CHS/CHT=China, etc.)",
            "regions": "Geographic regions (GST=Gulf States, MSI=Mascarene Islands, etc.)"
        },
        "us_states_list": us_states,
        "islands_list": islands,
        "subdivisions_list": subdivisions,
        "regions_list": regions
    }
    
    with open(os.path.join(base_dir, 'index.json'), 'w') as f:
        json.dump(index_data, f, indent=2)
    
    print(f"\n🎯 Organization complete!")
    print(f"📁 Base directory: {base_dir}")
    print(f"📊 Total regions: {sum(region_count.values())}")
    print(f"   • Countries: {region_count['countries']}")
    print(f"   • US States: {region_count['us_states']}")
    print(f"   • Islands: {region_count['islands']}")
    print(f"   • Subdivisions: {region_count['subdivisions']}")
    print(f"   • Regions: {region_count['regions']}")
    print(f"\n📋 Files created:")
    print(f"   • {base_dir}/countries.geojson")
    print(f"   • {base_dir}/us_states.geojson")
    print(f"   • {base_dir}/islands.geojson")
    print(f"   • {base_dir}/subdivisions.geojson")
    print(f"   • {base_dir}/regions.geojson")
    print(f"   • {base_dir}/individual/[CODE]_[NAME].geojson (one file per region)")
    print(f"   • {base_dir}/index.json (summary and organization info)")

def create_quick_lookup_script():
    """Create a helper script for quick lookups"""
    
    script_content = '''#!/usr/bin/env python3
"""Quick lookup helper for organized GeoJSON files"""

import json
import os

def find_region(code):
    """Find a region by its code"""
    base_dir = 'src/assets/data/geojsons_organized'
    
    # Load index
    with open(os.path.join(base_dir, 'index.json'), 'r') as f:
        index = json.load(f)
    
    # Find in individual files
    individual_dir = os.path.join(base_dir, 'individual')
    for filename in os.listdir(individual_dir):
        if filename.startswith(f'{code}_'):
            filepath = os.path.join(individual_dir, filename)
            with open(filepath, 'r') as f:
                data = json.load(f)
            return data['features'][0]
    
    return None

def list_regions_by_category(category):
    """List all regions in a category"""
    base_dir = 'src/assets/data/geojsons_organized'
    filepath = os.path.join(base_dir, f'{category}.geojson')
    
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            data = json.load(f)
        
        for feature in data['features']:
            code = feature['properties']['locationCode']
            name = feature['properties']['name']
            print(f"{code}: {name}")
    else:
        print(f"Category '{category}' not found")

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python3 lookup.py find <CODE>")
        print("  python3 lookup.py list <CATEGORY>")
        print("Categories: countries, us_states, islands, subdivisions, regions")
    elif sys.argv[1] == 'find' and len(sys.argv) > 2:
        region = find_region(sys.argv[2])
        if region:
            print(json.dumps(region, indent=2))
        else:
            print(f"Region {sys.argv[2]} not found")
    elif sys.argv[1] == 'list' and len(sys.argv) > 2:
        list_regions_by_category(sys.argv[2])
'''
    
    with open('src/assets/data/geojsons_organized/lookup.py', 'w') as f:
        f.write(script_content)
    
    print("✅ Created lookup.py helper script")

if __name__ == '__main__':
    organize_geojson_regions()
    create_quick_lookup_script()