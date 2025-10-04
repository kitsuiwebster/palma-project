#!/usr/bin/env python3
"""
Create PNG_Papua_New_Guinea.geojson by combining NWG and BIS territories
"""
import json

def main():
    print("🔄 Creating PNG (Papua New Guinea) GeoJSON from NWG + BIS...")
    
    # Load NWG (New Guinea main island) 
    try:
        with open('src/assets/data/areas/NWG_New_Guinea.geojson', 'r') as f:
            nwg_data = json.load(f)
        print("✅ Loaded NWG (New Guinea)")
    except Exception as e:
        print(f"❌ Error loading NWG: {e}")
        return False
    
    # For now, we'll use NWG as the base for PNG
    # BIS (Bismarck Archipelago) has only a rectangle placeholder, so we'll keep PNG as NWG for now
    # In the future, we can add proper Bismarck Islands boundaries
    
    png_geojson = {
        "type": "Feature",
        "properties": {
            "name": "Papua New Guinea",
            "locationCode": "PNG"
        },
        "geometry": nwg_data['geometry']  # Use NWG's real boundaries
    }
    
    # Save PNG GeoJSON
    try:
        with open('src/assets/data/areas/PNG_Papua_New_Guinea.geojson', 'w') as f:
            json.dump(png_geojson, f, indent=4)
        print("✅ Created PNG_Papua_New_Guinea.geojson")
        return True
    except Exception as e:
        print(f"❌ Error saving PNG: {e}")
        return False

if __name__ == "__main__":
    main()