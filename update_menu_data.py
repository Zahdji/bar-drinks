import os
import sys
import json
import urllib.request
import urllib.parse

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

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

def supabase_patch(table, row_id, data):
    url = f"{SUPABASE_URL}/rest/v1/{table}?id=eq.{row_id}"
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), method='PATCH')
    req.add_header("apikey", SUPABASE_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_KEY}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=representation")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def normalize_name(s):
    return s.lower().replace(" ", "").replace("-", "").replace("'", "").replace("&", "and").replace(".", "").replace("!", "")

def main():
    print("Fetching records from Supabase...")
    cocktails = supabase_get('cocktails')
    cocktails_zh = supabase_get('cocktailsZH')

    print(f"Fetched {len(cocktails)} records from 'cocktails' and {len(cocktails_zh)} records from 'cocktailsZH'.")

    # Map menu items by normalized name
    menu_dict = {}
    for item in MENU_ITEMS:
        norm = normalize_name(item['name'])
        menu_dict[norm] = item
        if 'name_zh' in item:
            norm_zh = normalize_name(item['name_zh'])
            menu_dict[norm_zh] = item

    matched_count = 0
    unmatched = []

    # Match and update 'cocktails' table
    for row in cocktails:
        r_id = row['id']
        r_name = row['name']
        norm = normalize_name(r_name)

        match = menu_dict.get(norm)
        if not match:
            for k, v in menu_dict.items():
                if k in norm or norm in k:
                    match = v
                    break

        if match:
            matched_count += 1
            price_val = match['price']
            supabase_patch('cocktails', r_id, {'price': price_val})
            print(f"Updated cocktails: {r_name} -> Price: NT$ {price_val}")
        else:
            unmatched.append(r_name)

    print(f"\nMatched {matched_count}/{len(cocktails)} cocktails in 'cocktails'.")
    if unmatched:
        print(f"Unmatched cocktails in 'cocktails': {unmatched}")

    # Match and update 'cocktailsZH' table
    cocktails_by_id = {r['id']: r for r in cocktails}

    matched_zh_count = 0
    unmatched_zh = []
    for row in cocktails_zh:
        r_id = row['id']
        orig_cocktail = cocktails_by_id.get(r_id)
        r_name_en = orig_cocktail['name'] if orig_cocktail else ''
        r_name_zh = row['name']
        
        norm_en = normalize_name(r_name_en)
        norm_zh = normalize_name(r_name_zh)

        match = menu_dict.get(norm_en) or menu_dict.get(norm_zh)
        if not match:
            for k, v in menu_dict.items():
                if (k and norm_en and (k in norm_en or norm_en in k)) or (k and norm_zh and (k in norm_zh or norm_zh in k)):
                    match = v
                    break

        if match:
            matched_zh_count += 1
            price_val = match['price']
            name_zh_val = match['name_zh']
            supabase_patch('cocktailsZH', r_id, {'price': price_val, 'name': name_zh_val})
            print(f"Updated cocktailsZH: ID {r_id[:8]}... ({r_name_en or r_name_zh}) -> Name: {name_zh_val}, Price: NT$ {price_val}")
        else:
            unmatched_zh.append(r_name_zh or r_name_en)

    print(f"\nMatched {matched_zh_count}/{len(cocktails_zh)} cocktails in 'cocktailsZH'.")
    if unmatched_zh:
        print(f"Unmatched in 'cocktailsZH': {unmatched_zh}")

if __name__ == '__main__':
    main()
