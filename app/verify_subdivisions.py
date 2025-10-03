#!/usr/bin/env python3
"""Verify all subdivisions are correctly set up"""

import json

def main():
    # Final verification
    with open('src/assets/data/map.geojson', 'r') as f:
        data = json.load(f)

    print('Final verification - Countries with subdivisions:')
    print()

    china_subs = []
    argentina_subs = []
    mexico_subs = []

    for feature in data['features']:
        code = feature['properties']['locationCode']
        name = feature['properties']['name']
        species = feature['properties']['speciesCount']
        
        if code.startswith('CH') and len(code) == 3 and code != 'CHA':
            china_subs.append(f'  {code}: {name} ({species} species)')
        elif code.startswith('AG'):
            argentina_subs.append(f'  {code}: {name} ({species} species)')
        elif code.startswith('MX'):
            mexico_subs.append(f'  {code}: {name} ({species} species)')

    print('CHINA subdivisions:')
    for item in sorted(china_subs):
        print(item)

    print('\nARGENTINA subdivisions:')  
    for item in sorted(argentina_subs):
        print(item)

    print('\nMEXICO subdivisions:')
    for item in sorted(mexico_subs):
        print(item)

    # Check that old generic codes are gone
    old_codes = ['CHN', 'ARG', 'MEX']
    remaining_old = []
    for feature in data['features']:
        if feature['properties']['locationCode'] in old_codes:
            remaining_old.append(feature['properties']['locationCode'])

    if remaining_old:
        print(f'\n❌ Old generic codes still present: {remaining_old}')
    else:
        print(f'\n✅ All generic codes successfully replaced with subdivisions!')

if __name__ == '__main__':
    main()