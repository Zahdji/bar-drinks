import os
import json
import urllib.request

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
url = env.get('EXPO_PUBLIC_SUPABASE_URL')
key = env.get('EXPO_PUBLIC_SUPABASE_ANON_KEY')

def get_table(table):
    req = urllib.request.Request(f'{url}/rest/v1/{table}?select=*')
    req.add_header('apikey', key)
    req.add_header('Authorization', f'Bearer {key}')
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

c_en = get_table('cocktails')
c_zh = get_table('cocktailsZH')

print(f"cocktails count: {len(c_en)}")
print(f"cocktailsZH count: {len(c_zh)}")

ids_en = set(r['id'] for r in c_en)
ids_zh = set(r['id'] for r in c_zh)

missing_in_zh = ids_en - ids_zh
missing_in_en = ids_zh - ids_en

print(f"Missing in cocktailsZH: {len(missing_in_zh)}")
print(f"Missing in cocktails: {len(missing_in_en)}")
