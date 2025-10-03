#!/usr/bin/env python3
"""Test region extraction from dataset"""

import json
import re

def test_regions():
    with open('src/assets/data/dataset.json', 'r') as f:
        dataset = json.load(f)

    # Get all unique region codes
    all_region_codes = set()
    
    for palm in dataset['data']:
        native_region = palm.get('NativeRegion', '')
        # Extract region codes (2-3 letter codes)
        codes = re.findall(r'\b[A-Z]{2,3}\b', native_region)
        all_region_codes.update(codes)
    
    print(f"Total unique region codes found: {len(all_region_codes)}")
    print(f"First 20 region codes: {sorted(list(all_region_codes))[:20]}")
    
    # Check if we have region codes in region_codes.json
    with open('src/assets/data/region_codes.json', 'r') as f:
        region_codes = json.load(f)
    
    missing_codes = []
    existing_codes = []
    
    for code in sorted(all_region_codes):
        if code in region_codes:
            existing_codes.append(code)
        else:
            missing_codes.append(code)
    
    print(f"\nRegion codes in dataset: {len(existing_codes)}")
    print(f"Missing from region_codes.json: {len(missing_codes)}")
    
    if missing_codes:
        print(f"Missing codes: {missing_codes[:10]}...")
    
    # Show some examples
    print(f"\nExample region mappings:")
    for code in sorted(existing_codes)[:10]:
        name = region_codes[code]['name']
        print(f"  {code}: {name}")

if __name__ == '__main__':
    test_regions()