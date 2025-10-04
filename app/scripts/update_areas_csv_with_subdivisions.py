#!/usr/bin/env python3
"""Update areas.csv to include subdivisions instead of unified countries"""

import json

def update_areas_csv():
    """Update areas.csv with subdivision data"""
    
    # Count species by subdivision from location.csv
    subdivision_counts = {}
    with open('src/assets/data/location.csv', 'r') as f:
        lines = f.readlines()
        for line in lines[1:]:  # Skip header
            parts = line.strip().split(',')
            if len(parts) >= 2:
                code = parts[0]
                species = parts[1]
                
                if code not in subdivision_counts:
                    subdivision_counts[code] = set()
                subdivision_counts[code].add(species)
    
    # Convert sets to counts
    for code in subdivision_counts:
        subdivision_counts[code] = len(subdivision_counts[code])
    
    # Get subdivision names from region_codes.json
    with open('src/assets/data/region_codes.json', 'r') as f:
        region_codes = json.load(f)
    
    # Read current areas.csv
    areas_data = []
    with open('src/assets/data/areas.csv', 'r') as f:
        lines = f.readlines()
        header = lines[0].strip()
        
        for line in lines[1:]:
            parts = line.strip().split(',')
            if len(parts) >= 3:
                code = parts[0]
                name = parts[1]
                count = int(parts[2])
                areas_data.append((code, name, count))
    
    # Remove unified countries and add subdivisions
    countries_to_replace = ['BRA', 'CHN', 'MEX', 'ARG']
    subdivisions = {
        'BRA': ['BZC', 'BZE', 'BZL', 'BZN', 'BZS'],
        'CHN': ['CHC', 'CHH', 'CHS', 'CHT'],
        'MEX': ['MXC', 'MXE', 'MXG', 'MXI', 'MXN', 'MXS', 'MXT'],
        'ARG': ['AGE', 'AGW']
    }
    
    # Filter out unified countries
    new_areas_data = []
    for code, name, count in areas_data:
        if code not in countries_to_replace:
            new_areas_data.append((code, name, count))
    
    # Add subdivisions
    for country_code, subdivision_codes in subdivisions.items():
        for subdivision_code in subdivision_codes:
            if subdivision_code in subdivision_counts and subdivision_code in region_codes:
                name = region_codes[subdivision_code].get('name', subdivision_code)
                count = subdivision_counts[subdivision_code]
                new_areas_data.append((subdivision_code, name, count))
                print(f"✅ Added {subdivision_code}: {name} ({count} species)")
    
    # Sort by area code
    new_areas_data.sort(key=lambda x: x[0])
    
    # Write updated areas.csv
    with open('src/assets/data/areas.csv', 'w') as f:
        f.write(header + '\n')
        for code, name, count in new_areas_data:
            f.write(f"{code},{name},{count}\n")
    
    print(f"\n🎯 Updated areas.csv with {len(new_areas_data)} areas (including subdivisions)")
    
    # Verify totals
    total_unified = sum(subdivision_counts[code] for subdivisions_list in subdivisions.values() for code in subdivisions_list if code in subdivision_counts)
    print(f"Total species in subdivisions:")
    for country_code, subdivision_codes in subdivisions.items():
        total = sum(subdivision_counts.get(code, 0) for code in subdivision_codes)
        print(f"  {country_code}: {total} species")

if __name__ == '__main__':
    update_areas_csv()