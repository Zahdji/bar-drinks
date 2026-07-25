import json
import os
import sys
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from deep_translator import GoogleTranslator

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def log(msg):
    print(msg, flush=True)

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

translation_cache = {
    "Stirred": "攪拌",
    "Shaken": "搖盪",
    "Bomb": "深水炸彈",
    "Shot": "一口酒/Shot",
    "Highball": "高球杯",
    "Whisky": "威士忌",
    "Full ice": "滿冰",
    "Full Ice": "滿冰",
    "Crushed Ice": "碎冰",
    "No Ice": "去冰",
    "Top": "加滿",
    "Splash": "少許/Splash",
    "Gin": "琴酒",
    "Vodka": "伏特加",
    "Tequila": "龍舌蘭",
    "Rum": "蘭姆酒",
    "Sour mix": "酸甜汁",
    "Club soda": "蘇打水",
    "Coke": "可樂",
    "Orange juice": "柳橙汁",
    "Cranberry juice": "蔓越莓汁",
    "Pineapple juice": "鳳梨汁",
    "Ginger ale": "薑汁汽水",
    "Grenadine syrup": "紅石榴糖漿",
    "Peach liqueur": "水蜜桃力嬌酒",
    "Melon liqueur": "哈密瓜力嬌酒",
    "Blue curacao": "藍柑橘力嬌酒",
    "Cassis liqueur": "黑加侖力嬌酒",
    "Triple sec": "白橙皮酒",
    "Kahlua": "卡魯哇咖啡力嬌酒",
    "Bailey's": "貝禮詩奶酒",
    "Cointreau": "君度橙酒",
    "Red Bull": "紅牛",
    "Lime": "檸檬/青檸",
    "White sugar": "白糖"
}

def translate_single_text(text):
    if not text or not text.strip():
        return text
    t_str = text.strip()
    if t_str in translation_cache:
        return translation_cache[t_str]
    try:
        translator = GoogleTranslator(source='auto', target='zh-TW')
        res = translator.translate(t_str)
        translation_cache[t_str] = res
        return res
    except Exception as e:
        return t_str

def main():
    env = load_env()
    supabase_url = env.get('EXPO_PUBLIC_SUPABASE_URL')
    supabase_key = env.get('EXPO_PUBLIC_SUPABASE_ANON_KEY')

    if not supabase_url or not supabase_key:
        log("Error: Supabase credentials missing in .env")
        return

    if not (supabase_url.startswith('http://') or supabase_url.startswith('https://')):
        supabase_url = f"https://{supabase_url}"

    headers = {
        'apikey': supabase_key,
        'Authorization': f"Bearer {supabase_key}",
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }

    # Step 1: Read all rows from cocktails table
    log("Reading cocktails table from Supabase...")
    fetch_url = f"{supabase_url}/rest/v1/cocktails?select=*"
    req = urllib.request.Request(fetch_url, headers=headers)
    try:
        with urllib.request.urlopen(req) as res:
            cocktails = json.loads(res.read().decode('utf-8'))
            log(f"Fetched {len(cocktails)} cocktails from cocktails table.")
    except Exception as e:
        log(f"Error fetching cocktails: {e}")
        return

    # Step 2: Collect all unique text strings that need translation
    unique_texts = set()
    for c in cocktails:
        if c.get('category'): unique_texts.add(c['category'].strip())
        if c.get('glass'): unique_texts.add(c['glass'].strip())
        if c.get('ice'): unique_texts.add(c['ice'].strip())
        if c.get('instructions'): unique_texts.add(c['instructions'].strip())
        if c.get('garnish'): unique_texts.add(c['garnish'].strip())
        ings = c.get('ingredients', [])
        if isinstance(ings, list):
            for ing in ings:
                if isinstance(ing, dict):
                    if ing.get('name'): unique_texts.add(ing['name'].strip())
                    if ing.get('amount'): unique_texts.add(ing['amount'].strip())

    texts_to_translate = [t for t in unique_texts if t not in translation_cache]
    log(f"Unique strings requiring translation: {len(texts_to_translate)}")

    # Step 3: Concurrent translation of unique strings
    if texts_to_translate:
        log("Starting parallel translation of unique text strings...")
        with ThreadPoolExecutor(max_workers=12) as executor:
            executor.map(translate_single_text, texts_to_translate)
        log("Parallel translation finished.")

    # Step 4: Read existing records in cocktailsZH table
    fetch_zh_url = f"{supabase_url}/rest/v1/cocktailsZH?select=id,name"
    req_zh = urllib.request.Request(fetch_zh_url, headers=headers)
    try:
        with urllib.request.urlopen(req_zh) as res:
            existing_zh = json.loads(res.read().decode('utf-8'))
            existing_zh_map = {item['name'].strip().lower(): item['id'] for item in existing_zh}
            log(f"Found {len(existing_zh)} existing records in cocktailsZH.")
    except Exception as e:
        existing_zh_map = {}

    inserted_count = 0
    updated_count = 0

    log("Populating cocktailsZH table with translated records...")
    for idx, c in enumerate(cocktails, 1):
        name = c.get('name', '').strip()

        category_zh = translate_single_text(c.get('category')) if c.get('category') else None
        glass_zh = translate_single_text(c.get('glass')) if c.get('glass') else None
        ice_zh = translate_single_text(c.get('ice')) if c.get('ice') else None
        instructions_zh = translate_single_text(c.get('instructions')) if c.get('instructions') else None
        garnish_zh = translate_single_text(c.get('garnish')) if c.get('garnish') else None
        
        raw_ings = c.get('ingredients', [])
        ingredients_zh = []
        if isinstance(raw_ings, list):
            for ing in raw_ings:
                if isinstance(ing, dict):
                    ingredients_zh.append({
                        'name': translate_single_text(ing.get('name', '')),
                        'amount': translate_single_text(ing.get('amount', ''))
                    })
                else:
                    ingredients_zh.append(ing)

        payload = {
            'name': name, # Copy name as-is per user request
            'category': category_zh,
            'glass': glass_zh,
            'ice': ice_zh,
            'ingredients': ingredients_zh,
            'instructions': instructions_zh,
            'garnish': garnish_zh
        }

        name_key = name.lower()
        if name_key in existing_zh_map:
            zh_id = existing_zh_map[name_key]
            update_url = f"{supabase_url}/rest/v1/cocktailsZH?id=eq.{urllib.parse.quote(zh_id)}"
            req_up = urllib.request.Request(update_url, data=json.dumps(payload).encode('utf-8'), headers=headers, method='PATCH')
            try:
                with urllib.request.urlopen(req_up) as res:
                    updated_count += 1
            except Exception as e:
                err = e.read().decode('utf-8') if hasattr(e, 'read') else str(e)
                log(f"  Error updating {name}: {err}")
        else:
            insert_url = f"{supabase_url}/rest/v1/cocktailsZH"
            req_ins = urllib.request.Request(insert_url, data=json.dumps(payload).encode('utf-8'), headers=headers, method='POST')
            try:
                with urllib.request.urlopen(req_ins) as res:
                    res_data = json.loads(res.read().decode('utf-8'))
                    if isinstance(res_data, list) and len(res_data) > 0:
                        existing_zh_map[name_key] = res_data[0].get('id')
                    inserted_count += 1
            except Exception as e:
                err = e.read().decode('utf-8') if hasattr(e, 'read') else str(e)
                log(f"  Error inserting {name}: {err}")

    log("\n--- Translation Summary ---")
    log(f"Inserted in cocktailsZH: {inserted_count}")
    log(f"Updated in cocktailsZH: {updated_count}")

    req_final = urllib.request.Request(fetch_zh_url, headers=headers)
    try:
        with urllib.request.urlopen(req_final) as res:
            final_zh = json.loads(res.read().decode('utf-8'))
            log(f"Total rows in cocktailsZH table now: {len(final_zh)}")
    except Exception as e:
        log(f"Error checking final count: {e}")

if __name__ == '__main__':
    main()
