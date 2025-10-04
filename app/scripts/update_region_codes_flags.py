#!/usr/bin/env python3
"""
Script to update region_codes.json to use flag image URLs instead of emojis
"""
import json

def get_flag_url(code, name):
    """Generate flag URL based on region code and name"""
    
    # Country code mapping for flagcdn.com
    flag_mappings = {
        'AFG': 'af',  # Afghanistan
        'AGE': 'ar',  # Argentina East
        'AGW': 'ar',  # Argentina West
        'ALA': 'us',  # Alabama (US state)
        'ALG': 'dz',  # Algeria
        'AND': 'in',  # Andaman Islands (India)
        'ANG': 'ao',  # Angola
        'ARI': 'us',  # Arizona (US state)
        'ARK': 'us',  # Arkansas (US state)
        'ASS': 'in',  # Assam (India)
        'BAH': 'bs',  # Bahamas
        'BAL': 'es',  # Baleares (Spain)
        'BAN': 'bd',  # Bangladesh
        'BEN': 'bj',  # Benin
        'BER': 'bm',  # Bermuda
        'BIS': 'pg',  # Bismarck Archipelago (Papua New Guinea)
        'BKN': 'bf',  # Burkina Faso
        'BLZ': 'bz',  # Belize
        'BOL': 'bo',  # Bolivia
        'BOR': 'my',  # Borneo (Malaysia)
        'BOT': 'bw',  # Botswana
        'BUR': 'mm',  # Burma (Myanmar)
        'BZC': 'br',  # Brazil Central
        'BZE': 'br',  # Brazil East
        'BZL': 'br',  # Brazil Southeast
        'BZN': 'br',  # Brazil North
        'BZS': 'br',  # Brazil South
        'CAB': 'ao',  # Cabinda (Angola)
        'CAF': 'cf',  # Central African Republic
        'CAL': 'us',  # California (US state)
        'CAY': 'ky',  # Cayman Islands
        'CBD': 'kh',  # Cambodia
        'CHA': 'td',  # Chad
        'CHC': 'cn',  # China Central
        'CHH': 'cn',  # China South Central
        'CHS': 'cn',  # China South
        'CHT': 'cn',  # China Tibet
        'CLM': 'co',  # Colombia
        'CMN': 'cm',  # Cameroon
        'CNY': 'es',  # Canary Islands (Spain)
        'COM': 'km',  # Comoros
        'CON': 'cg',  # Congo
        'COO': 'ck',  # Cook Islands
        'COS': 'cr',  # Costa Rica
        'CPI': 'za',  # Cape Province (South Africa)
        'CPP': 'io',  # Chagos Archipelago
        'CPV': 'cv',  # Cape Verde
        'CRL': 'fm',  # Caroline Islands
        'CTM': 'cx',  # Christmas Island Territory
        'CUB': 'cu',  # Cuba
        'CVI': 'cv',  # Cape Verde Islands
        'DJI': 'dj',  # Djibouti
        'DOM': 'do',  # Dominican Republic
        'EAI': '',    # East Africa Islands (no specific flag)
        'ECU': 'ec',  # Ecuador
        'EGY': 'eg',  # Egypt
        'EHM': '',    # East Himalaya (no specific flag)
        'ELS': 'sv',  # El Salvador
        'EQG': 'gq',  # Equatorial Guinea
        'ERI': 'er',  # Eritrea
        'ETH': 'et',  # Ethiopia
        'FIJ': 'fj',  # Fiji
        'FLA': 'us',  # Florida (US state)
        'FRA': 'fr',  # France
        'FRG': 'gf',  # French Guiana
        'GAB': 'ga',  # Gabon
        'GAM': 'gm',  # Gambia
        'GEO': 'us',  # Georgia (US state)
        'GGI': '',    # Gulf of Guinea Islands (no specific flag)
        'GHA': 'gh',  # Ghana
        'GNB': 'gw',  # Guinea-Bissau
        'GST': 'sa',  # Gulf States (Saudi Arabia)
        'GUA': 'gt',  # Guatemala
        'GUI': 'gn',  # Guinea
        'GUY': 'gy',  # Guyana
        'HAI': 'ht',  # Haiti
        'HAW': 'us',  # Hawaii (US state)
        'HON': 'hn',  # Honduras
        'IND': 'in',  # India
        'IRN': 'ir',  # Iran
        'IRQ': 'iq',  # Iraq
        'ITA': 'it',  # Italy
        'IVO': 'ci',  # Ivory Coast
        'JAM': 'jm',  # Jamaica
        'JAP': 'jp',  # Japan
        'JAW': 'id',  # Java (Indonesia)
        'JNF': 'cl',  # Juan Fernandez Islands (Chile)
        'KEN': 'ke',  # Kenya
        'KER': 'tf',  # Kerguelen Islands
        'KRI': 'gr',  # Kriti (Greece)
        'LAO': 'la',  # Laos
        'LBR': 'lr',  # Liberia
        'LBY': 'ly',  # Libya
        'LEE': '',    # Leeward Islands (no specific flag)
        'LOU': 'us',  # Louisiana (US state)
        'LSI': 'id',  # Lesser Sunda Islands (Indonesia)
        'MAU': 'mu',  # Mauritius
        'MCI': 'mp',  # Mariana Islands
        'MDG': 'mg',  # Madagascar
        'MLI': 'ml',  # Mali
        'MLW': 'mw',  # Malawi
        'MLY': 'my',  # Malaysia
        'MOL': 'id',  # Moluccas (Indonesia)
        'MOR': 'ma',  # Morocco
        'MOZ': 'mz',  # Mozambique
        'MRN': 'za',  # Marion Island (South Africa)
        'MRQ': 'pf',  # Marquesas (French Polynesia)
        'MSI': '',    # Mascarene Islands (no specific flag)
        'MTN': 'mr',  # Mauritania
        'MXC': 'mx',  # Mexico Central
        'MXE': 'mx',  # Mexico East
        'MXG': 'mx',  # Mexico Gulf
        'MXI': 'mx',  # Mexico Islands
        'MXN': 'mx',  # Mexico North
        'MXS': 'mx',  # Mexico South
        'MXT': 'mx',  # Mexico Southeast
        'MYA': 'mm',  # Myanmar
        'NAM': 'na',  # Namibia
        'NAT': 'za',  # Natal (South Africa)
        'NCA': 'us',  # North Carolina (US state)
        'NCB': 'in',  # Nicobar Islands (India)
        'NEP': 'np',  # Nepal
        'NFK': 'nf',  # Norfolk Island
        'NGA': 'ng',  # Nigeria
        'NGR': 'ne',  # Niger
        'NIC': 'ni',  # Nicaragua
        'NNS': 'jp',  # Nansei-shoto (Japan)
        'NSW': 'au',  # New South Wales (Australia)
        'NTA': 'au',  # Northern Territory (Australia)
        'NWC': 'nc',  # New Caledonia
        'NWG': 'pg',  # New Guinea (Papua New Guinea)
        'NZN': 'nz',  # New Zealand North
        'NZS': 'nz',  # New Zealand South
        'OGA': 'jp',  # Ogasawara Islands (Japan)
        'OKL': 'us',  # Oklahoma (US state)
        'OMA': 'om',  # Oman
        'PAK': 'pk',  # Pakistan
        'PAL': 'ps',  # Palestine
        'PAN': 'pa',  # Panama
        'PAR': 'py',  # Paraguay
        'PER': 'pe',  # Peru
        'PHI': 'ph',  # Philippines
        'POR': 'pt',  # Portugal
        'PUE': 'pr',  # Puerto Rico
        'QLD': 'au',  # Queensland (Australia)
        'REU': 're',  # Réunion
        'ROD': 'mu',  # Rodrigues (Mauritius)
        'RWA': 'rw',  # Rwanda
        'SAM': 'ws',  # Samoa
        'SAR': 'it',  # Sardinia (Italy)
        'SAU': 'sa',  # Saudi Arabia
        'SCA': 'us',  # South Carolina (US state)
        'SCZ': 'sb',  # Santa Cruz Islands (Solomon Islands)
        'SEN': 'sn',  # Senegal
        'SEY': 'sc',  # Seychelles
        'SIC': 'it',  # Sicily (Italy)
        'SIE': 'sl',  # Sierra Leone
        'SIN': 'sg',  # Singapore
        'SOL': 'sb',  # Solomon Islands
        'SOM': 'so',  # Somalia
        'SPA': 'es',  # Spain
        'SRL': 'lk',  # Sri Lanka
        'SUD': 'sd',  # Sudan
        'SUL': 'id',  # Sulawesi (Indonesia)
        'SUM': 'id',  # Sumatra (Indonesia)
        'SUR': 'sr',  # Suriname
        'SWC': '',    # Southwest Caribbean (no specific flag)
        'SWZ': 'sz',  # Swaziland
        'TAI': 'tw',  # Taiwan
        'TAN': 'tz',  # Tanzania
        'TCI': 'ta',  # Tristan da Cunha Islands
        'TEX': 'us',  # Texas (US state)
        'THA': 'th',  # Thailand
        'TOG': 'tg',  # Togo
        'TOK': 'tk',  # Tokelau
        'TON': 'to',  # Tonga
        'TRT': 'tt',  # Trinidad and Tobago
        'TUA': 'pf',  # Tuamotu Archipelago (French Polynesia)
        'TUN': 'tn',  # Tunisia
        'TUR': 'tr',  # Turkey
        'TVL': 'tv',  # Tuvalu
        'UGA': 'ug',  # Uganda
        'URU': 'uy',  # Uruguay
        'VAN': 'vu',  # Vanuatu
        'VEN': 've',  # Venezuela
        'VIC': 'au',  # Victoria (Australia)
        'VIE': 'vn',  # Vietnam
        'VNA': 've',  # Venezuela Antilles
        'WAL': 'gb-wls',  # Wales (special code)
        'WAU': 'au',  # Western Australia
        'WHM': '',    # Western Himalayas (no specific flag)
        'WIN': '',    # Windward Islands (no specific flag)
        'XMS': 'cx',  # Christmas Island
        'YEM': 'ye',  # Yemen
        'ZAI': 'cd',  # Zaire (DR Congo)
        'ZAM': 'zm',  # Zambia
        'ZIM': 'zw',  # Zimbabwe
    }
    
    country_code = flag_mappings.get(code, '')
    if country_code:
        return f'https://flagcdn.com/w20/{country_code}.png'
    else:
        return ''  # Empty for regions without specific flags

def main():
    # Read current region codes
    with open('src/assets/data/region_codes.json', 'r', encoding='utf-8') as f:
        region_data = json.load(f)
    
    # Update each entry to use flag URLs instead of emojis
    updated_count = 0
    for code, data in region_data.items():
        old_flag = data['flag']
        new_flag_url = get_flag_url(code, data['name'])
        
        if new_flag_url != old_flag:
            data['flag'] = new_flag_url
            updated_count += 1
            print(f"Updated {code}: {data['name']} -> {new_flag_url}")
    
    # Write updated file
    with open('src/assets/data/region_codes.json', 'w', encoding='utf-8') as f:
        json.dump(region_data, f, ensure_ascii=False, indent=2)
    
    print(f"\nUpdated {updated_count} flag entries with image URLs")

if __name__ == "__main__":
    main()