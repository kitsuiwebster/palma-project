#!/usr/bin/env python3
"""
Utility script to convert region codes to country/region names
Usage: python3 convert_codes_to_names.py "BOR, PHI" -> "Borneo, Philippines"
"""
import json
import sys

def load_region_codes():
    """Load region codes mapping from JSON file"""
    with open('src/assets/data/region_codes.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def convert_codes_to_names(codes_string, region_codes, include_flags=False):
    """Convert comma-separated codes to country/region names with optional flags"""
    if not codes_string or codes_string.strip() == '':
        return ''
    
    codes = [code.strip() for code in codes_string.split(',')]
    results = []
    
    for code in codes:
        if code in region_codes:
            region_data = region_codes[code]
            if include_flags and region_data['flag']:
                # Use HTML img tag for flag images
                flag_html = f'<img src="{region_data["flag"]}" class="flag-img" alt="{region_data["name"]} flag">'
                results.append(f"{flag_html} {region_data['name']}")
            else:
                results.append(region_data['name'])
        else:
            print(f"Warning: Unknown code '{code}'", file=sys.stderr)
            results.append(code)  # Keep original code if not found
    
    return ', '.join(results)

def main():
    if len(sys.argv) < 2 or len(sys.argv) > 3:
        print("Usage: python3 convert_codes_to_names.py \"CODE1, CODE2, ...\" [--flags]")
        print("Examples:")
        print("  python3 convert_codes_to_names.py \"BOR, PHI\"")
        print("  python3 convert_codes_to_names.py \"HAI, FRA\" --flags")
        sys.exit(1)
    
    codes_input = sys.argv[1]
    include_flags = len(sys.argv) == 3 and sys.argv[2] == '--flags'
    
    region_codes = load_region_codes()
    
    result = convert_codes_to_names(codes_input, region_codes, include_flags)
    print(result)

if __name__ == "__main__":
    main()