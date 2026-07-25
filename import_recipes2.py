import csv
import json
import os
import re
import sys
import urllib.parse
import urllib.request

# Ensure standard output handles UTF-8 on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def load_env(env_path='.env'):
    """Parse .env file to extract Supabase environment variables."""
    env_vars = {}
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                if '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key.strip()] = value.strip().strip("'").strip('"')
    return env_vars

def format_ingredient_name(name):
    """Format ingredient name (e.g. 'lime' -> 'Lime', 'white sugar' -> 'White sugar')."""
    name = name.strip()
    if not name:
        return ""
    name = name.rstrip('.,;:')
    if not name:
        return ""
    return name[0].upper() + name[1:]

def format_amount(amount):
    """Format ingredient amount (e.g. 'top' -> 'Top', '1half' -> '1/2')."""
    amount = amount.strip().rstrip('.,;:')
    if not amount:
        return ""
    
    # Normalize top
    if amount.lower() == 'top':
        return 'Top'
    if amount.lower().startswith('top'):
        rest = amount[3:].strip()
        if rest.startswith('90%') or rest.startswith('(90%)'):
            return 'Top (90%)'
        if rest:
            return f"Top {rest}"
        return 'Top'
    
    # Normalize splash
    if amount.lower() == 'splash':
        return 'Splash'
    if amount.lower().startswith('splash'):
        return 'Splash'
    
    # Normalize '1half' or 'half'
    if amount.lower() in ('1half', 'half'):
        return '1/2'
    
    # Normalize '1wedge' -> '1 wedge'
    m_w = re.match(r'^(\d+)\s*(wedge|wedges|slice|slices)$', amount, re.IGNORECASE)
    if m_w:
        return f"{m_w.group(1)} {m_w.group(2).lower()}"

    # Normalize '2/3 drops', '6/7 slices'
    m_sl = re.match(r'^(\d+/\d+)\s*(slices|wedges|drops)?$', amount, re.IGNORECASE)
    if m_sl:
        unit = f" {m_sl.group(2).lower()}" if m_sl.group(2) else ""
        return f"{m_sl.group(1)}{unit}"

    return amount

def parse_ingredient(item):
    """Parse raw ingredient string into dict with 'name' and 'amount'."""
    item = item.strip()
    if not item:
        return None
    
    item = item.rstrip('. ').strip()

    # 1. Match trailing top / splash variations: e.g. 'Warm water top', '7up splash'
    m_top = re.match(r'^(.*?)\s+(top(?:\s*\d+%|\s*\([^)]+\)|\s+half)?|splash)$', item, re.IGNORECASE)
    if m_top and m_top.group(1):
        name = format_ingredient_name(m_top.group(1))
        amount = format_amount(m_top.group(2))
        return {'name': name, 'amount': amount}

    # 2. Match trailing numeric or unit/amount pattern:
    m_end = re.match(
        r'^(.*?)\s+((?:\d+(?:\.\d+)?\s*(?:ml|oz|cl|dash|dashes|drop|drops|tsp|tbsp|g|wedge|wedges|slice|slices)?|\d+/\d+\s*(?:slices|wedges|drops)?|1half|half|\d+\s+big\s+wedges|\d+/\d+slices))$',
        item,
        re.IGNORECASE
    )
    if m_end and m_end.group(1):
        name = format_ingredient_name(m_end.group(1))
        amount = format_amount(m_end.group(2))
        return {'name': name, 'amount': amount}

    # 3. Match leading numeric or amount pattern:
    m_start = re.match(
        r'^((?:\d+/\d+|\d+(?:\.\d+)?|half|1half)\s*(?:ml|oz|cl|dash|dashes|drop|drops|tsp|tbsp|g|wedge|wedges|slice|slices)?)\s+(.*)$',
        item,
        re.IGNORECASE
    )
    if m_start and m_start.group(2):
        name = format_ingredient_name(m_start.group(2))
        amount = format_amount(m_start.group(1))
        return {'name': name, 'amount': amount}

    # 4. Trailing parenthetical quantity: e.g. 'Mint leaves 8(big) / 12(small)'
    m_paren = re.match(r'^(.*?)\s+(\d+\s*\([^)]+\).*)', item, re.IGNORECASE)
    if m_paren and m_paren.group(1):
        name = format_ingredient_name(m_paren.group(1))
        amount = format_amount(m_paren.group(2))
        return {'name': name, 'amount': amount}

    # Fallback: full string as name, empty amount
    return {'name': format_ingredient_name(item), 'amount': ''}

def parse_ingredients_field(ingredients_str):
    """Parse comma-separated ingredients field into structured list of ingredient objects."""
    if not ingredients_str:
        return []
    raw_items = [x.strip() for x in ingredients_str.split(',') if x.strip()]
    parsed_items = []
    for raw in raw_items:
        # Check for un-comma'd combined items like 'Sour mix 30ml 7UP top'
        m_combined = re.match(r'^(.*?\s+\d+(?:\.\d+)?\s*(?:ml|oz|cl))\s+((?:7up|club soda|sprite|coke|ginger ale).*)$', raw, re.IGNORECASE)
        if m_combined:
            ing1 = parse_ingredient(m_combined.group(1))
            ing2 = parse_ingredient(m_combined.group(2))
            if ing1: parsed_items.append(ing1)
            if ing2: parsed_items.append(ing2)
        else:
            ing = parse_ingredient(raw)
            if ing:
                parsed_items.append(ing)
    return parsed_items

def main():
    env = load_env()
    supabase_url = env.get('EXPO_PUBLIC_SUPABASE_URL')
    supabase_key = env.get('EXPO_PUBLIC_SUPABASE_ANON_KEY')

    if not supabase_url or not supabase_key:
        print("Error: Could not find EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env file.")
        return

    # Normalize Supabase base URL
    if not (supabase_url.startswith('http://') or supabase_url.startswith('https://')):
        supabase_url = f"https://{supabase_url}"

    headers = {
        'apikey': supabase_key,
        'Authorization': f"Bearer {supabase_key}",
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }

    # Step 1: Read existing cocktails from Supabase
    fetch_url = f"{supabase_url}/rest/v1/cocktails?select=id,name"
    req = urllib.request.Request(fetch_url, headers=headers)
    try:
        with urllib.request.urlopen(req) as res:
            existing_data = json.loads(res.read().decode('utf-8'))
            existing_map = {item['name'].strip().lower(): item['id'] for item in existing_data}
            print(f"Connected to Supabase. Found {len(existing_data)} existing cocktails.")
    except Exception as e:
        print(f"Failed to fetch existing cocktails: {e}")
        existing_map = {}

    # Step 2: Read recipes2.csv
    csv_file = 'recipes2.csv'
    if not os.path.exists(csv_file):
        print(f"Error: {csv_file} not found in project root.")
        return

    inserted_count = 0
    updated_count = 0
    valid_categories = {'Stirred', 'Shaken', 'Bomb', 'Shot'}

    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row.get('name', '').strip()
            if not name:
                continue

            raw_cat = row.get('category', '').strip()
            if raw_cat in valid_categories:
                category = raw_cat
            elif raw_cat == 'Virgin':
                category = 'Stirred'  # Map Virgin cocktails to Stirred to satisfy check constraint
            else:
                category = raw_cat if raw_cat else None

            glass = row.get('glass', '').strip() or None
            ice = row.get('ice', '').strip() or None
            instructions = row.get('instructions', '').strip() or None
            ingredients_raw = row.get('ingredients', '')

            ingredients = parse_ingredients_field(ingredients_raw)

            payload = {
                'name': name,
                'category': category,
                'glass': glass,
                'ice': ice,
                'ingredients': ingredients,
                'instructions': instructions
            }

            name_key = name.lower()
            if name_key in existing_map:
                # Upsert / Update existing
                cocktail_id = existing_map[name_key]
                update_url = f"{supabase_url}/rest/v1/cocktails?id=eq.{urllib.parse.quote(cocktail_id)}"
                req = urllib.request.Request(update_url, data=json.dumps(payload).encode('utf-8'), headers=headers, method='PATCH')
                try:
                    with urllib.request.urlopen(req) as res:
                        updated_count += 1
                        print(f"Updated cocktail: {name}")
                except Exception as e:
                    err_msg = e.read().decode('utf-8') if hasattr(e, 'read') else str(e)
                    print(f"Failed to update cocktail {name}: {err_msg}")
            else:
                # Insert new
                insert_url = f"{supabase_url}/rest/v1/cocktails"
                req = urllib.request.Request(insert_url, data=json.dumps(payload).encode('utf-8'), headers=headers, method='POST')
                try:
                    with urllib.request.urlopen(req) as res:
                        res_data = json.loads(res.read().decode('utf-8'))
                        if isinstance(res_data, list) and len(res_data) > 0:
                            existing_map[name_key] = res_data[0].get('id')
                        inserted_count += 1
                        print(f"Inserted cocktail: {name}")
                except Exception as e:
                    err_msg = e.read().decode('utf-8') if hasattr(e, 'read') else str(e)
                    print(f"Failed to insert cocktail {name}: {err_msg}")

    print("\n--- Import Summary ---")
    print(f"Inserted: {inserted_count}")
    print(f"Updated: {updated_count}")

    # Step 3: Fetch total cocktails count after script execution
    req = urllib.request.Request(fetch_url, headers=headers)
    try:
        with urllib.request.urlopen(req) as res:
            final_data = json.loads(res.read().decode('utf-8'))
            print(f"Total cocktails in database now: {len(final_data)}")
    except Exception as e:
        print(f"Failed to fetch final count: {e}")

if __name__ == '__main__':
    main()
