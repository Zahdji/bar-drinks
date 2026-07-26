import csv
import json
import os
import re
import sys
import uuid
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor
from deep_translator import GoogleTranslator

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def log(msg):
    print(msg, flush=True)

def load_env(env_path='.env'):
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

env = load_env()
SUPABASE_URL = env.get('EXPO_PUBLIC_SUPABASE_URL', 'https://jygexaszukotdhhssjwp.supabase.co')
SUPABASE_KEY = env.get('EXPO_PUBLIC_SUPABASE_ANON_KEY', '')

if not (SUPABASE_URL.startswith('http://') or SUPABASE_URL.startswith('https://')):
    SUPABASE_URL = f"https://{SUPABASE_URL}"

HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f"Bearer {SUPABASE_KEY}",
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

# --- Translation dictionary & helpers ---
translation_cache = {
    "Stirred": "攪拌",
    "Shaken": "搖盪",
    "Bomb": "深水炸彈",
    "Shot": "一口酒/Shot",
    "Highball": "高球杯",
    "Whisky": "威士忌杯",
    "Virgin+Shot": "無酒精+SHOT杯",
    "Cocktail": "雞尾酒杯",
    "Full ice": "滿冰",
    "Full Ice": "滿冰",
    "Crushed Ice": "碎冰",
    "No Ice": "去冰",
    "None": "無冰",
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
    if not text or not str(text).strip():
        return text
    t_str = str(text).strip()
    if t_str in translation_cache:
        return translation_cache[t_str]
    try:
        translator = GoogleTranslator(source='auto', target='zh-TW')
        res = translator.translate(t_str)
        translation_cache[t_str] = res
        return res
    except Exception as e:
        return t_str

# --- Ingredient Parser ---
def format_ingredient_name(name):
    name = name.strip()
    if not name:
        return ""
    return name[0].upper() + name[1:]

def format_amount(amount):
    amount = amount.strip()
    if not amount:
        return ""
    if amount.lower() == 'top':
        return 'Top'
    if amount.lower().startswith('top '):
        return 'Top' + amount[3:]
    return amount

def parse_ingredient(item):
    item = item.strip()
    if not item:
        return None
    m_end = re.match(
        r'^(.*?)\s+((?:\d+(?:\.\d+)?\s*(?:ml|oz|cl|dash|dashes|drop|drops|tsp|tbsp|g)?|top(?:\s*\([^)]+\))?|splash|float))$',
        item,
        re.IGNORECASE
    )
    if m_end and m_end.group(1):
        return {'name': format_ingredient_name(m_end.group(1)), 'amount': format_amount(m_end.group(2))}
    m_start = re.match(
        r'^((?:\d+/\d+|\d+(?:\.\d+)?)\s*(?:ml|oz|cl|dash|dashes|drop|drops|tsp|tbsp|g|wedge|wedges|slice|slices)?)\s+(.*)$',
        item,
        re.IGNORECASE
    )
    if m_start and m_start.group(2):
        return {'name': format_ingredient_name(m_start.group(2)), 'amount': format_amount(m_start.group(1))}
    return {'name': format_ingredient_name(item), 'amount': ''}

def parse_ingredients_field(ingredients_str):
    if not ingredients_str:
        return []
    raw_items = [x.strip() for x in ingredients_str.split(',') if x.strip()]
    parsed_items = []
    for raw in raw_items:
        ing = parse_ingredient(raw)
        if ing:
            parsed_items.append(ing)
    return parsed_items

# --- Menu Data pre-parsed from menu photo files (Menu1.png - Menu7.png) ---
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

def normalize_name(s):
    if not s: return ""
    return s.lower().replace(" ", "").replace("-", "").replace("'", "").replace("&", "and").replace(".", "").replace("!", "").replace("•", "")

# Build dictionary for fast menu matching
MENU_DICT = {}
for m in MENU_ITEMS:
    n = normalize_name(m['name'])
    if n: MENU_DICT[n] = m
    if 'name_zh' in m:
        n_zh = normalize_name(m['name_zh'])
        if n_zh: MENU_DICT[n_zh] = m

def get_menu_match(name):
    nm = normalize_name(name)
    if nm in MENU_DICT:
        return MENU_DICT[nm]
    for k, v in MENU_DICT.items():
        if k and nm and (k in nm or nm in k):
            return v
    return None

# --- Supabase REST API Helpers ---
def supabase_fetch(table):
    url = f"{SUPABASE_URL}/rest/v1/{table}?select=id,name"
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def supabase_delete_all(table):
    rows = supabase_fetch(table)
    if not rows:
        log(f"Table {table} is already empty.")
        return
    ids = [r['id'] for r in rows]
    log(f"Deleting {len(ids)} rows from {table}...")
    
    chunk_size = 50
    for i in range(0, len(ids), chunk_size):
        chunk = ids[i:i+chunk_size]
        ids_param = ",".join([urllib.parse.quote(str(x)) for x in chunk])
        url = f"{SUPABASE_URL}/rest/v1/{table}?id=in.({ids_param})"
        req = urllib.request.Request(url, headers=HEADERS, method='DELETE')
        try:
            with urllib.request.urlopen(req) as resp:
                pass
        except Exception as e:
            log(f"Error deleting batch from {table}: {e}")

def supabase_insert_single(table, record):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    data_bytes = json.dumps(record).encode('utf-8')
    req = urllib.request.Request(url, data=data_bytes, headers=HEADERS, method='POST')
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

ALLOWED_CATEGORIES = {'Stirred', 'Shaken', 'Bomb', 'Shot'}

def main():
    log("=== Step 1: Wiping Corrupted Database Tables ===")
    supabase_delete_all("cocktailsZH")
    supabase_delete_all("cocktails")

    c_en_count = len(supabase_fetch("cocktails"))
    c_zh_count = len(supabase_fetch("cocktailsZH"))
    log(f"After wipe count - cocktails: {c_en_count}, cocktailsZH: {c_zh_count}")
    if c_en_count != 0 or c_zh_count != 0:
        log("Error: Tables were not completely wiped!")
        return

    log("\n=== Step 2 & 3: Clean Re-Seed from recipes.csv and recipes2.csv & Update Menu Prices ===")
    csv_files = ['recipes.csv', 'recipes2.csv']
    all_cocktails_data = []

    for cfile in csv_files:
        if not os.path.exists(cfile):
            log(f"Warning: {cfile} not found!")
            continue
        with open(cfile, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                name = row.get('name', '').strip()
                if not name:
                    continue
                all_cocktails_data.append(row)

    log(f"Total raw recipe rows read: {len(all_cocktails_data)}")

    unique_texts = set()
    for row in all_cocktails_data:
        for field in ['category', 'glass', 'ice', 'instructions']:
            v = row.get(field, '').strip()
            if v: unique_texts.add(v)
        ing_parsed = parse_ingredients_field(row.get('ingredients', ''))
        for ing in ing_parsed:
            if ing.get('name'): unique_texts.add(ing['name'])
            if ing.get('amount'): unique_texts.add(ing['amount'])

    texts_to_translate = [t for t in unique_texts if t not in translation_cache]
    log(f"Unique strings to translate: {len(texts_to_translate)}")
    if texts_to_translate:
        log("Translating strings in parallel...")
        with ThreadPoolExecutor(max_workers=10) as executor:
            executor.map(translate_single_text, texts_to_translate)
        log("Parallel translation finished.")

    inserted_en_count = 0
    inserted_zh_count = 0

    for idx, row in enumerate(all_cocktails_data, 1):
        cocktail_id = str(uuid.uuid4())
        
        name = row.get('name', '').strip()
        raw_category = row.get('category', '').strip() or None
        
        # Enforce check constraint for category in cocktails table
        category_en = raw_category if raw_category in ALLOWED_CATEGORIES else 'Stirred'

        glass = row.get('glass', '').strip() or None
        ice = row.get('ice', '').strip() or None
        instructions = row.get('instructions', '').strip() or None
        ingredients_parsed = parse_ingredients_field(row.get('ingredients', ''))

        menu_match = get_menu_match(name)
        if menu_match:
            price_val = f"NT$ {menu_match['price']}"
            name_zh_val = menu_match.get('name_zh', name)
        else:
            price_val = None
            name_zh_val = name

        record_en = {
            'id': cocktail_id,
            'name': name,
            'category': category_en,
            'glass': glass,
            'ice': ice,
            'ingredients': ingredients_parsed,
            'instructions': instructions,
            'price': price_val
        }

        try:
            supabase_insert_single('cocktails', record_en)
            inserted_en_count += 1
        except Exception as e:
            err_body = e.read().decode('utf-8') if hasattr(e, 'read') else str(e)
            log(f"Error inserting cocktail {name}: {err_body}")

        category_zh = translate_single_text(raw_category) if raw_category else None
        glass_zh = translate_single_text(glass) if glass else None
        ice_zh = translate_single_text(ice) if ice else None
        instructions_zh = translate_single_text(instructions) if instructions else None

        ingredients_zh = []
        for ing in ingredients_parsed:
            ingredients_zh.append({
                'name': translate_single_text(ing.get('name', '')),
                'amount': translate_single_text(ing.get('amount', ''))
            })

        record_zh = {
            'id': cocktail_id,
            'name': name_zh_val,
            'category': category_zh,
            'glass': glass_zh,
            'ice': ice_zh,
            'ingredients': ingredients_zh,
            'instructions': instructions_zh,
            'price': price_val
        }

        try:
            supabase_insert_single('cocktailsZH', record_zh)
            inserted_zh_count += 1
        except Exception as e:
            err_body = e.read().decode('utf-8') if hasattr(e, 'read') else str(e)
            log(f"Error inserting cocktailZH {name}: {err_body}")

        if idx % 20 == 0 or idx == len(all_cocktails_data):
            log(f"Processed {idx}/{len(all_cocktails_data)} cocktails...")

    log("\n=== Step 4: Verification ===")
    final_c_en = supabase_fetch("cocktails")
    final_c_zh = supabase_fetch("cocktailsZH")

    log(f"Final Total Row Count in cocktails: {len(final_c_en)}")
    log(f"Final Total Row Count in cocktailsZH: {len(final_c_zh)}")

    ids_en = set(r['id'] for r in final_c_en)
    ids_zh = set(r['id'] for r in final_c_zh)

    if ids_en == ids_zh and len(final_c_en) == len(all_cocktails_data):
        log(f"SUCCESS: 1:1 ID match confirmed for all {len(final_c_en)} records across both tables!")
    else:
        log(f"WARNING: Count or ID mismatch detected. English: {len(ids_en)}, Chinese: {len(ids_zh)}")

if __name__ == '__main__':
    main()
