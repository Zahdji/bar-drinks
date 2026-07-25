import csv
import json
import os
import re
import urllib.parse
import urllib.request

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
    return name[0].upper() + name[1:]

def format_amount(amount):
    """Format ingredient amount (e.g. 'top' -> 'Top', 'top (90%)' -> 'Top (90%)')."""
    amount = amount.strip()
    if not amount:
        return ""
    if amount.lower() == 'top':
        return 'Top'
    if amount.lower().startswith('top '):
        return 'Top' + amount[3:]
    return amount

def parse_ingredient(item):
    """Parse raw ingredient string into dict with 'name' and 'amount'."""
    item = item.strip()
    if not item:
        return None
    
    # 1. Match trailing amount: e.g. 'Whisky 60ml', 'Club soda top', 'Cranberry juice top (90%)'
    m_end = re.match(
        r'^(.*?)\s+((?:\d+(?:\.\d+)?\s*(?:ml|oz|cl|dash|dashes|drop|drops|tsp|tbsp|g)?|top(?:\s*\([^)]+\))?|splash|float))$',
        item,
        re.IGNORECASE
    )
    if m_end and m_end.group(1):
        name = format_ingredient_name(m_end.group(1))
        amount = format_amount(m_end.group(2))
        return {'name': name, 'amount': amount}
    
    # 2. Match leading amount: e.g. '1/2 lime', '2tsp white sugar', '1 wedge lime'
    m_start = re.match(
        r'^((?:\d+/\d+|\d+(?:\.\d+)?)\s*(?:ml|oz|cl|dash|dashes|drop|drops|tsp|tbsp|g|wedge|wedges|slice|slices)?)\s+(.*)$',
        item,
        re.IGNORECASE
    )
    if m_start and m_start.group(2):
        name = format_ingredient_name(m_start.group(2))
        amount = format_amount(m_start.group(1))
        return {'name': name, 'amount': amount}
        
    return {'name': format_ingredient_name(item), 'amount': ''}

def parse_ingredients_field(ingredients_str):
    """Parse comma-separated ingredients into a list of structured ingredient objects."""
    if not ingredients_str:
        return []
    raw_items = [x.strip() for x in ingredients_str.split(',') if x.strip()]
    parsed_items = []
    for raw in raw_items:
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

    # Step 2: Read recipes.csv
    csv_file = 'recipes.csv'
    if not os.path.exists(csv_file):
        print(f"Error: {csv_file} not found in project root.")
        return

    inserted_count = 0
    updated_count = 0

    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row.get('name', '').strip()
            if not name:
                continue

            category = row.get('category', '').strip() or None
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
                    print(f"Failed to update cocktail {name}: {e}")
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
                    print(f"Failed to insert cocktail {name}: {e}")

    print("\n--- Summary ---")
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
