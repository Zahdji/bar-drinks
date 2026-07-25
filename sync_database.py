import os
import sys
import json
import csv
import uuid
import urllib.request
import urllib.parse
from deep_translator import GoogleTranslator

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

translator = GoogleTranslator(source='auto', target='zh-TW')
en_translator = GoogleTranslator(source='auto', target='en')

def load_env(env_path='.env'):
    env_vars = {}
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'): continue
                if '=' in line:
                    k, v = line.split('=', 1)
                    env_vars[k.strip()] = v.strip().strip("'").strip('"')
    return env_vars

env = load_env()
SUPABASE_URL = env.get('EXPO_PUBLIC_SUPABASE_URL', 'https://jygexaszukotdhhssjwp.supabase.co')
SUPABASE_KEY = env.get('EXPO_PUBLIC_SUPABASE_ANON_KEY', '')

MENU_ITEMS = [
    # Menu 1
    {"name": "Tequila Sunrise", "name_zh": "龍舌蘭日出", "price": "200"},
    {"name": "Sex on the Beach", "name_zh": "性感沙灘", "price": "200"},
    {"name": "Dita Sour", "name_zh": "荔枝沙瓦", "price": "200"},
    {"name": "Vodka Lime", "name_zh": "伏特加萊姆", "price": "200"},
    {"name": "Caipirinha", "name_zh": "卡琵莉亞 (巴西甘蔗酒特調)", "price": "200"},
    {"name": "Melon High Ball", "name_zh": "蜜瓜球 (威士忌特調)", "price": "200"},
    {"name": "Melon Highball", "name_zh": "蜜瓜球 (威士忌特調)", "price": "200"},
    {"name": "Highball", "name_zh": "威士忌高球", "price": "200"},
    {"name": "Vodka Soda Lime", "name_zh": "伏特加蘇打+檸檬", "price": "200"},
    {"name": "Vodka Cranberry", "name_zh": "伏特加蔓越莓", "price": "200"},
    {"name": "Vodka Orange", "name_zh": "螺絲起子", "price": "200"},
    {"name": "Screwdriver", "name_zh": "螺絲起子", "price": "200"},
    {"name": "Gin Tonic", "name_zh": "琴湯尼", "price": "200"},
    {"name": "Gin & Tonic", "name_zh": "琴湯尼", "price": "200"},
    {"name": "Gin Fizz", "name_zh": "琴費士", "price": "200"},
    {"name": "Rum Coke", "name_zh": "蘭姆酒可樂", "price": "200"},
    {"name": "Captain Morgan Coke", "name_zh": "摩根可樂船長", "price": "200"},
    {"name": "Captain Morgan Ginger Ale", "name_zh": "摩根薑船長", "price": "200"},
    {"name": "Whisky Soda", "name_zh": "威士忌蘇打", "price": "200"},
    {"name": "Whisky Coke", "name_zh": "威士忌可樂", "price": "200"},
    {"name": "Whisky Ginger Ale", "name_zh": "威士忌薑汁汽水", "price": "200"},

    # Menu 2
    {"name": "Inca", "name_zh": "印加(焦糖酸酒)沙瓦", "price": "220"},
    {"name": "Inca - Sour Caramel", "name_zh": "印加(焦糖酸酒)沙瓦", "price": "220"},
    {"name": "Inca Sour Caramel", "name_zh": "印加(焦糖酸酒)沙瓦", "price": "220"},
    {"name": "Diablo", "name_zh": "暗黑破壞神 (黑醋栗利口酒)", "price": "220"},
    {"name": "Whisky Sour", "name_zh": "威士忌沙瓦", "price": "220"},
    {"name": "Whiskey Sour", "name_zh": "威士忌沙瓦", "price": "220"},
    {"name": "Southern Comfort Orange", "name_zh": "南方安逸+柳橙", "price": "220"},
    {"name": "Southern Comfort Ginger Ale", "name_zh": "南方安逸+薑汁汽水", "price": "220"},
    {"name": "Coconut Sunset", "name_zh": "椰香日落", "price": "220"},
    {"name": "Margarita", "name_zh": "瑪格麗特", "price": "220"},
    {"name": "Fireball Soda", "name_zh": "肉桂蘇打(威士忌特調)", "price": "220"},
    {"name": "Hot Toddy", "name_zh": "火熱托迪 (是熱的唷)", "price": "220"},
    {"name": "Hendrick's Tonic w/ Cucumber", "name_zh": "亨爵湯尼 + 小黃瓜", "price": "220"},
    {"name": "Hendrick's Tonic Cucumber", "name_zh": "亨爵湯尼 + 小黃瓜", "price": "220"},
    {"name": "Hendrick's Tonic w/ Lime", "name_zh": "亨爵湯尼 + 檸檬", "price": "220"},
    {"name": "Hendrick's Tonic", "name_zh": "亨爵湯尼", "price": "220"},
    {"name": "Jack Daniel's Coke", "name_zh": "傑克丹尼爾 + 可樂", "price": "220"},
    {"name": "Jameson Coke", "name_zh": "詹姆森 + 可樂", "price": "220"},
    {"name": "Jameson Ginger Ale", "name_zh": "詹姆森 + 薑汁汽水", "price": "220"},
    {"name": "Disaronno Ginger Ale", "name_zh": "迪沙羅納(杏仁) + 薑汁汽水", "price": "220"},
    {"name": "White Russian", "name_zh": "白俄羅斯 (貝禮詩奶酒)", "price": "220"},
    {"name": "Sloe Gin Fizz", "name_zh": "黑刺李琴費士", "price": "220"},
    {"name": "Vodka Red Bull", "name_zh": "伏特加紅牛", "price": "270"},
    {"name": "Jager Red Bull", "name_zh": "野格紅牛", "price": "270"},
    {"name": "Mojito", "name_zh": "摩西多 (限量)", "price": "270"},
    {"name": "Virgin Mojito", "name_zh": "無酒精摩西多", "price": "270"},
    {"name": "Martini Dry", "name_zh": "馬丁尼", "price": "270"},
    {"name": "Dry Martini", "name_zh": "馬丁尼", "price": "270"},
    {"name": "Vodka Martini Dry", "name_zh": "伏特加馬丁尼", "price": "270"},
    {"name": "Gin Martini Dry", "name_zh": "琴酒馬丁尼", "price": "270"},
    {"name": "New York Sour", "name_zh": "紐約沙瓦", "price": "270"},
    {"name": "Godfather", "name_zh": "教父", "price": "270"},
    {"name": "Cosmopolitan", "name_zh": "柯夢波丹", "price": "270"},
    {"name": "Grasshopper", "name_zh": "綠色炸蚱", "price": "270"},
    {"name": "Long Island", "name_zh": "長島冰茶", "price": "350"},
    {"name": "Long Island Iced Tea", "name_zh": "長島冰茶", "price": "350"},
    {"name": "Adios", "name_zh": "謝謝再聯絡", "price": "350"},
    {"name": "AMF", "name_zh": "謝謝再聯絡", "price": "350"},
    {"name": "Adios Motherfucker", "name_zh": "謝謝再聯絡", "price": "350"},
    {"name": "Tokyo Tea", "name_zh": "東京茶", "price": "400"},
    {"name": "Trashcan", "name_zh": "泡泡糖公主", "price": "400"},

    # Menu 3
    {"name": "Miao Nasui", "name_zh": "喵娜蘇", "price": "200"},
    {"name": "Passion Fizz", "name_zh": "百香費士", "price": "220"},
    {"name": "Ursula", "name_zh": "烏蘇拉 (紅酒特調)", "price": "220"},
    {"name": "Tru Grape", "name_zh": "真•葡萄", "price": "220"},
    {"name": "Passion Summer", "name_zh": "盛夏光年", "price": "220"},
    {"name": "Zoe", "name_zh": "公主病", "price": "220"},
    {"name": "Cocomelon", "name_zh": "口渴美人", "price": "220"},
    {"name": "Guadalupe", "name_zh": "瓜地洛普 (百香果特調)", "price": "270"},
    {"name": "Tropical Breeze", "name_zh": "熱帶微風", "price": "270"},
    {"name": "Garden of Eden", "name_zh": "青蘋果樂園", "price": "270"},
    {"name": "Womanizer", "name_zh": "渣男", "price": "270"},
    {"name": "Pink Bitch", "name_zh": "戀愛巴士", "price": "270"},

    # Menu 4
    {"name": "Jake's Curse", "name_zh": "傑克的魔咒", "price": "350"},
    {"name": "French Kiss", "name_zh": "法式喇舌", "price": "350"},
    {"name": "Jade", "name_zh": "翡翠檸檬", "price": "350"},
    {"name": "Pink Island", "name_zh": "粉紅長島", "price": "350"},
    {"name": "I Dare You!", "name_zh": "闖海盟主", "price": "350"},
    {"name": "I Dare You", "name_zh": "闖海盟主", "price": "350"},
    {"name": "Titanic", "name_zh": "鐵達尼號", "price": "400"},
    {"name": "Wang Wang", "name_zh": "歪歪", "price": "450"},
    {"name": "Wang Wang Premium", "name_zh": "登愣", "price": "550"},
    {"name": "Around the World - Orange or Pineapple", "name_zh": "環遊世界", "price": "550"},
    {"name": "Around the World", "name_zh": "環遊世界", "price": "550"},
    {"name": "Aroung the World Orange", "name_zh": "環遊世界 (柳橙)", "price": "550"},
    {"name": "Aroung the World Pineapple", "name_zh": "環遊世界 (鳳梨)", "price": "550"},

    # Menu 5
    {"name": "Drive Me Crazy", "name_zh": "駛我瘋狂 (奶酒)", "price": "220"},
    {"name": "Pirate's Tea", "name_zh": "海盜茶", "price": "220"},
    {"name": "Calypso", "name_zh": "海妖之淚", "price": "220"},
    {"name": "Smoked Plum", "name_zh": "變調烏梅汁", "price": "220"},
    {"name": "Summer Crave", "name_zh": "仲夏•我柚渴了", "price": "220"},
    {"name": "A Drop from the Mermaids", "name_zh": "人魚親親", "price": "220"},
    {"name": "A Drop From the Mermaids", "name_zh": "人魚親親", "price": "220"},
    {"name": "Jie's Apple", "name_zh": "初嚐禁果", "price": "220"},
    {"name": "Camila", "name_zh": "卡蜜拉", "price": "270"},
    {"name": "I'm Not Drunk You Are", "name_zh": "梅柚醉", "price": "270"},
    {"name": "Rebecca", "name_zh": "瑞貝卡", "price": "270"},
    {"name": "The Sweet Spot", "name_zh": "敏感帶", "price": "270"},

    # Menu 6
    {"name": "Jagermeister", "name_zh": "野格", "price": "150"},
    {"name": "Vodka", "name_zh": "伏特加", "price": "150"},
    {"name": "Tequila", "name_zh": "龍舌蘭酒", "price": "150"},
    {"name": "Incaramel Vodka", "name_zh": "焦糖多多", "price": "150"},
    {"name": "Cookie's and Crazy", "name_zh": "瘋狂餅乾(奶酒)", "price": "150"},
    {"name": "Cookie's & Crazy", "name_zh": "瘋狂餅乾(奶酒)", "price": "150"},
    {"name": "Ulala", "name_zh": "烏拉拉 (酸甜)", "price": "150"},
    {"name": "Fireball", "name_zh": "撒旦肉桂威士忌", "price": "180"},
    {"name": "Jameson", "name_zh": "詹姆森", "price": "180"},
    {"name": "Baby Guinness", "name_zh": "迷你健力士", "price": "180"},
    {"name": "Tequila Rose", "name_zh": "龍舌蘭玫瑰草莓奶酒", "price": "180"},
    {"name": "Patron", "name_zh": "培恩(龍舌蘭)", "price": "200"},
    {"name": "B52", "name_zh": "轟炸機", "price": "250"},
    {"name": "Jager • Tequila • Vodka", "name_zh": "趕進度組(野格．龍舌蘭．伏特加)", "price": "400"},
    {"name": "Incendia", "name_zh": "醉夏", "price": "500"},
    {"name": "Tiffany Blue", "name_zh": "蒂芙妮藍", "price": "700"},

    # Menu 7
    {"name": "Blue Tuesday", "name_zh": "憂鬱星期二", "price": "220"},
    {"name": "Jager Bomb", "name_zh": "野格炸彈", "price": "220"},
    {"name": "Vodka Bomb", "name_zh": "伏特加炸彈", "price": "220"},
    {"name": "Tequila Bomb", "name_zh": "龍舌蘭炸彈", "price": "220"},
    {"name": "Vegas Bomb", "name_zh": "維加斯派對", "price": "220"},
    {"name": "Maleficent's Curse", "name_zh": "黑魔女沉睡魔咒", "price": "220"},
    {"name": "Esmeralda", "name_zh": "鐘樓怪人", "price": "220"},
    {"name": "Trainwreck", "name_zh": "斷軌", "price": "270"},
    {"name": "Jager Bomb Bomb", "name_zh": "進階版深水炸彈", "price": "350"},
    {"name": "Hand Grenade", "name_zh": "手榴彈", "price": "350"},
    {"name": "Shipwreck", "name_zh": "沉船", "price": "350"},
    {"name": "Jesus Bomb", "name_zh": "耶穌救贖", "price": "400"},
    {"name": "Regret", "name_zh": "後悔(慶生失戀報仇必點)", "price": "500"},
    {"name": "Hell", "name_zh": "絕望.喝就對了", "price": "600"},

    # Additional Spec & Virgin Drinks
    {"name": "Eclipse", "name_zh": "日蝕", "price": "220"},
    {"name": "Pink Alizé", "name_zh": "粉紅艾利斯", "price": "220"},
    {"name": "Blue Alizé", "name_zh": "藍色艾利斯", "price": "220"},
    {"name": "Virgin OG", "name_zh": "無酒精柳橙葡萄柚", "price": "180"},
    {"name": "Virgin PPF", "name_zh": "無酒精百香百香費士", "price": "180"},
    {"name": "Virgin OP", "name_zh": "無酒精柳橙鳳梨", "price": "180"}
]

def supabase_get(table):
    url = f"{SUPABASE_URL}/rest/v1/{table}?select=*"
    req = urllib.request.Request(url)
    req.add_header("apikey", SUPABASE_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_KEY}")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def supabase_insert(table, data):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), method='POST')
    req.add_header("apikey", SUPABASE_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_KEY}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=representation")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def supabase_patch(table, row_id, data):
    url = f"{SUPABASE_URL}/rest/v1/{table}?id=eq.{row_id}"
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), method='PATCH')
    req.add_header("apikey", SUPABASE_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_KEY}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=representation")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def supabase_delete(table, row_id):
    url = f"{SUPABASE_URL}/rest/v1/{table}?id=eq.{row_id}"
    req = urllib.request.Request(url, method='DELETE')
    req.add_header("apikey", SUPABASE_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_KEY}")
    with urllib.request.urlopen(req) as resp:
        return True

def normalize_name(s):
    if not s: return ""
    return s.lower().replace(" ", "").replace("-", "").replace("'", "").replace("&", "and").replace(".", "").replace("!", "")

def translate_safe(text, target='zh'):
    if not text or not text.strip(): return ""
    try:
        if target == 'zh':
            return translator.translate(text)
        else:
            return en_translator.translate(text)
    except Exception as e:
        return text

def parse_ingredients_from_csv_row(row):
    ingredients = []
    for i in range(1, 10):
        ing_name = row.get(f'ingredient{i}', '') or row.get(f'Ingredient {i}', '')
        ing_amt = row.get(f'amount{i}', '') or row.get(f'Amount {i}', '')
        if ing_name and ing_name.strip():
            ingredients.append({'name': ing_name.strip(), 'amount': ing_amt.strip() if ing_amt else ''})
    return ingredients

def main():
    print("--- STEP 1: LOAD DATABASE & CSV RECIPES ---")
    cocktails = supabase_get('cocktails')
    cocktails_zh = supabase_get('cocktailsZH')

    print(f"Existing cocktails in Supabase: {len(cocktails)}")
    print(f"Existing cocktailsZH in Supabase: {len(cocktails_zh)}")

    menu_lookup = {}
    for item in MENU_ITEMS:
        norm = normalize_name(item['name'])
        menu_lookup[norm] = item
        if 'name_zh' in item:
            menu_lookup[normalize_name(item['name_zh'])] = item

    # Load recipes from CSV files
    csv_recipes = []
    for csv_file in ['recipes.csv', 'recipes2.csv']:
        if os.path.exists(csv_file):
            with open(csv_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    csv_recipes.append(row)

    print(f"Loaded {len(csv_recipes)} recipes from CSV files.")

    # Check for missing CSV drinks in 'cocktails'
    existing_en_names = set(normalize_name(c['name']) for c in cocktails)
    inserted_csv_count = 0

    for csv_r in csv_recipes:
        c_name = csv_r.get('name', '').strip() or csv_r.get('Name', '').strip()
        if not c_name: continue
        norm = normalize_name(c_name)

        if norm not in existing_en_names:
            # Missing in 'cocktails', insert it!
            new_id = str(uuid.uuid4())
            cat = csv_r.get('category', '').strip() or csv_r.get('Category', '').strip() or 'Stirred'
            if cat not in ['Stirred', 'Shaken', 'Bomb', 'Shot']:
                cat = 'Stirred'
            
            menu_match = menu_lookup.get(norm, {})
            price_val = menu_match.get('price', '')

            ingredients = parse_ingredients_from_csv_row(csv_r)
            payload = {
                'id': new_id,
                'name': c_name,
                'category': cat,
                'glass': csv_r.get('glass', '').strip() or csv_r.get('Glass', '').strip() or '',
                'ice': csv_r.get('ice', '').strip() or csv_r.get('Ice', '').strip() or '',
                'price': price_val,
                'ingredients': ingredients,
                'instructions': csv_r.get('instructions', '').strip() or csv_r.get('Method', '').strip() or '',
                'garnish': csv_r.get('garnish', '').strip() or csv_r.get('Garnish', '').strip() or ''
            }
            supabase_insert('cocktails', payload)
            existing_en_names.add(norm)
            inserted_csv_count += 1
            print(f"Restored missing CSV drink into 'cocktails': {c_name} (ID: {new_id})")

    if inserted_csv_count > 0:
        cocktails = supabase_get('cocktails')
        print(f"Total 'cocktails' count after CSV restore: {len(cocktails)}")

    print("\n--- STEP 2: BIDIRECTIONAL SYNC (cocktails ↔ cocktailsZH with 1:1 Matching IDs) ---")
    
    # Index both tables by ID and by Normalized Name
    zh_by_id = {r['id']: r for r in cocktails_zh}
    zh_by_norm = {normalize_name(r['name']): r for r in cocktails_zh}
    
    en_by_id = {r['id']: r for r in cocktails}
    en_by_norm = {normalize_name(r['name']): r for r in cocktails}

    # Forward Sync: Ensure every record in 'cocktails' has a 1:1 matching record in 'cocktailsZH' with EXACT SAME ID
    for c_row in cocktails:
        c_id = c_row['id']
        c_name = c_row['name']
        norm_name = normalize_name(c_name)

        if c_id not in zh_by_id:
            # Check if cocktailsZH has a row with matching name but different ID
            matched_zh = zh_by_norm.get(norm_name)
            if matched_zh:
                # Delete old mismatched ID row in cocktailsZH, and re-insert with c_id!
                supabase_delete('cocktailsZH', matched_zh['id'])
                print(f"Re-keying cocktailsZH: {c_name} (Old ID {matched_zh['id'][:8]}... -> New ID {c_id[:8]}...)")
                
                # Use menu match for Traditional Chinese title if available
                menu_match = menu_lookup.get(norm_name, {})
                title_zh = menu_match.get('name_zh', matched_zh['name'])
                price_val = c_row.get('price') or matched_zh.get('price') or menu_match.get('price', '')

                new_zh_payload = {
                    'id': c_id,
                    'name': title_zh,
                    'category': matched_zh.get('category', c_row.get('category')),
                    'glass': matched_zh.get('glass', c_row.get('glass')),
                    'ice': matched_zh.get('ice', c_row.get('ice')),
                    'price': price_val,
                    'ingredients': matched_zh.get('ingredients', c_row.get('ingredients')),
                    'instructions': matched_zh.get('instructions', c_row.get('instructions')),
                    'garnish': matched_zh.get('garnish', c_row.get('garnish'))
                }
                supabase_insert('cocktailsZH', new_zh_payload)
            else:
                # Need to translate and insert brand new row into cocktailsZH with c_id!
                print(f"Translating & Forward Syncing to cocktailsZH: {c_name} (ID {c_id[:8]}...)")
                menu_match = menu_lookup.get(norm_name, {})
                title_zh = menu_match.get('name_zh') or translate_safe(c_name, 'zh')
                glass_zh = translate_safe(c_row.get('glass', ''), 'zh')
                ice_zh = translate_safe(c_row.get('ice', ''), 'zh')
                garnish_zh = translate_safe(c_row.get('garnish', ''), 'zh')
                instr_zh = translate_safe(c_row.get('instructions', ''), 'zh')

                ing_zh = []
                for ing in (c_row.get('ingredients') or []):
                    ing_zh.append({
                        'name': translate_safe(ing.get('name', ''), 'zh'),
                        'amount': translate_safe(ing.get('amount', ''), 'zh')
                    })

                new_zh_payload = {
                    'id': c_id,
                    'name': title_zh,
                    'category': c_row.get('category'),
                    'glass': glass_zh,
                    'ice': ice_zh,
                    'price': c_row.get('price') or menu_match.get('price', ''),
                    'ingredients': ing_zh,
                    'instructions': instr_zh,
                    'garnish': garnish_zh
                }
                supabase_insert('cocktailsZH', new_zh_payload)

    # Re-fetch cocktailsZH after forward sync
    cocktails_zh = supabase_get('cocktailsZH')
    zh_by_id = {r['id']: r for r in cocktails_zh}

    # Reverse Sync: Ensure any row in 'cocktailsZH' that has no matching ID in 'cocktails' is synced back to 'cocktails'
    for zh_row in cocktails_zh:
        zh_id = zh_row['id']
        zh_name = zh_row['name']
        norm_name = normalize_name(zh_name)

        if zh_id not in en_by_id:
            # Check if cocktails has a row with matching name
            matched_en = en_by_norm.get(norm_name)
            if not matched_en:
                print(f"Reverse Syncing to cocktails: {zh_name} (ID {zh_id[:8]}...)")
                title_en = translate_safe(zh_name, 'en')
                glass_en = translate_safe(zh_row.get('glass', ''), 'en')
                ice_en = translate_safe(zh_row.get('ice', ''), 'en')
                garnish_en = translate_safe(zh_row.get('garnish', ''), 'en')
                instr_en = translate_safe(zh_row.get('instructions', ''), 'en')

                ing_en = []
                for ing in (zh_row.get('ingredients') or []):
                    ing_en.append({
                        'name': translate_safe(ing.get('name', ''), 'en'),
                        'amount': translate_safe(ing.get('amount', ''), 'en')
                    })

                new_en_payload = {
                    'id': zh_id,
                    'name': title_en,
                    'category': zh_row.get('category') or 'Stirred',
                    'glass': glass_en,
                    'ice': ice_en,
                    'price': zh_row.get('price', ''),
                    'ingredients': ing_en,
                    'instructions': instr_en,
                    'garnish': garnish_en
                }
                supabase_insert('cocktails', new_en_payload)

    print("\n--- STEP 3: FINAL INTEGRITY CHECK ---")
    final_en = supabase_get('cocktails')
    final_zh = supabase_get('cocktailsZH')

    final_en_ids = set(r['id'] for r in final_en)
    final_zh_ids = set(r['id'] for r in final_zh)

    print(f"Final 'cocktails' row count: {len(final_en)}")
    print(f"Final 'cocktailsZH' row count: {len(final_zh)}")

    if len(final_en) == len(final_zh) and final_en_ids == final_zh_ids:
        print("SUCCESS: 1:1 ID match verified across both tables with 0 missing records!")
    else:
        print(f"WARNING: ID mismatch detected! Diff: {final_en_ids ^ final_zh_ids}")

if __name__ == '__main__':
    main()
