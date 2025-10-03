#!/usr/bin/env python3
"""Count unique species for Argentina and China"""

import json
import re

def count_species():
    # Load dataset
    with open('src/assets/data/dataset.json', 'r') as f:
        dataset = json.load(f)
    
    argentina_species = set()
    china_species = set()
    
    for palm in dataset['data']:
        native_region = palm.get('NativeRegion', '')
        species_name = palm.get('SpecName', '')
        
        # Check for Argentina regions (AGE, AGW)
        if re.search(r'\b(AGE|AGW)\b', native_region):
            argentina_species.add(species_name)
        
        # Check for China regions (CHC, CHH, CHS, CHT)
        if re.search(r'\b(CHC|CHH|CHS|CHT)\b', native_region):
            china_species.add(species_name)
    
    print(f"Argentina unique species: {len(argentina_species)}")
    print("Argentina species:")
    for species in sorted(argentina_species):
        print(f"  - {species}")
    
    print(f"\nChina unique species: {len(china_species)}")
    print("China species:")
    for species in sorted(china_species):
        print(f"  - {species}")

if __name__ == '__main__':
    count_species()