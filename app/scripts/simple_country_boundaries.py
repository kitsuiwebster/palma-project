#!/usr/bin/env python3
"""Create simple but realistic country boundaries"""

import json
import os

def create_brazil_geometry():
    """Create Brazil geometry based on approximate coordinates"""
    return {
        "type": "Polygon",
        "coordinates": [[
            [-74.0, -33.7],  # Southwest
            [-34.8, -33.7],  # Southeast
            [-34.8, 5.3],    # Northeast
            [-60.0, 5.3],    # North center
            [-74.0, -7.0],   # Northwest
            [-74.0, -33.7]   # Back to southwest
        ]]
    }

def create_china_geometry():
    """Create China geometry based on approximate coordinates"""
    return {
        "type": "Polygon", 
        "coordinates": [[
            [73.6, 18.2],    # Southwest (Xinjiang)
            [134.8, 18.2],   # Southeast (Hainan area)
            [134.8, 53.6],   # Northeast (Heilongjiang)
            [73.6, 53.6],    # Northwest (Xinjiang north)
            [73.6, 18.2]     # Back to southwest
        ]]
    }

def create_mexico_geometry():
    """Create Mexico geometry based on approximate coordinates"""
    return {
        "type": "Polygon",
        "coordinates": [[
            [-118.4, 14.5],  # Southwest (Baja California Sur)
            [-86.7, 14.5],   # Southeast (Yucatan)
            [-86.7, 32.7],   # Northeast (border with US)
            [-118.4, 32.7],  # Northwest (Baja California)
            [-118.4, 14.5]   # Back to southwest
        ]]
    }

def create_argentina_geometry():
    """Create Argentina geometry based on approximate coordinates"""
    return {
        "type": "Polygon",
        "coordinates": [[
            [-73.6, -55.0],  # Southwest (Tierra del Fuego)
            [-53.7, -55.0],  # Southeast (Atlantic coast)
            [-53.7, -21.8],  # Northeast (border with Brazil)
            [-73.6, -21.8],  # Northwest (border with Chile)
            [-73.6, -55.0]   # Back to southwest
        ]]
    }

def update_country_files():
    """Update country files with simple realistic boundaries"""
    
    countries = {
        'BRA': {
            'name': 'Brazil',
            'species': 428,
            'geometry': create_brazil_geometry()
        },
        'CHN': {
            'name': 'China', 
            'species': 107,
            'geometry': create_china_geometry()
        },
        'MEX': {
            'name': 'Mexico',
            'species': 172, 
            'geometry': create_mexico_geometry()
        },
        'ARG': {
            'name': 'Argentina',
            'species': 15,
            'geometry': create_argentina_geometry()
        }
    }
    
    geojson_dir = 'src/assets/data/areas/'
    updated_files = []
    
    for code, data in countries.items():
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
                "geometry": data['geometry']
            }]
        }
        
        # Save file
        filename = f"{code}_{data['name']}.geojson"
        filepath = os.path.join(geojson_dir, filename)
        
        try:
            with open(filepath, 'w') as f:
                json.dump(geojson, f, indent=2)
            
            updated_files.append(filename)
            print(f"✅ Updated {filename} with realistic boundaries")
            
            # Show bounds
            coords = data['geometry']['coordinates'][0]
            lons = [c[0] for c in coords]
            lats = [c[1] for c in coords]
            print(f"   Bounds: lon {min(lons):.1f} to {max(lons):.1f}, lat {min(lats):.1f} to {max(lats):.1f}")
            
        except Exception as e:
            print(f"❌ Error saving {filename}: {e}")
    
    print(f"\n🎯 Updated {len(updated_files)} countries with realistic boundaries!")
    return updated_files

if __name__ == '__main__':
    update_country_files()