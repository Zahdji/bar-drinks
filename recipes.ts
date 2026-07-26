import { supabase } from './lib/supabase';

export interface Ingredient {
  name: string;
  amount: string;
}

export interface Cocktail {
  id: string;
  name: string;
  glass?: string;
  ice?: string;
  ingredients: Ingredient[];
  method?: string;
  created_at?: string;
  category?: string;
  price?: string;
}

export const initialRecipes: Cocktail[] = [];

// Lightweight translation helper for Traditional Chinese (zh-TW)
const translationDictionary: Record<string, string> = {
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
  "Lime": "檸檬/青檸",
  "White sugar": "白糖"
};

export async function translateToZH(text?: string): Promise<string> {
  if (!text || !text.trim()) return '';
  const trimmed = text.trim();
  if (translationDictionary[trimmed]) {
    return translationDictionary[trimmed];
  }
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=zh-TW&dt=t&q=${encodeURIComponent(trimmed)}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const result = data[0].map((x: any) => x[0]).join('');
        if (result) return result;
      }
    }
  } catch (err) {
    console.warn('Translation failed, using original text:', err);
  }
  return trimmed;
}

export async function translateIngredientsToZH(ingredients: Ingredient[]): Promise<Ingredient[]> {
  return Promise.all(
    ingredients.map(async (ing) => ({
      name: await translateToZH(ing.name),
      amount: await translateToZH(ing.amount)
    }))
  );
}

// Supabase API Helpers
export async function fetchRecipesFromSupabase(tableName: string = 'cocktails'): Promise<{ data: Cocktail[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn(`Supabase fetch error on ${tableName}:`, error.message);
      return { data: null, error };
    }

    if (!data || data.length === 0) {
      return { data: null, error: null };
    }

    const formatted: Cocktail[] = data.map((item: any) => ({
      id: item.id,
      name: item.name,
      category: item.category || '',
      glass: item.glass || '',
      ice: item.ice || '',
      price: item.price || '',
      ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
      method: item.instructions || item.method || '',
      created_at: item.created_at
    }));

    return { data: formatted, error: null };
  } catch (err) {
    console.warn(`Supabase request failed on ${tableName}:`, err);
    return { data: null, error: err };
  }
}

export interface CreateCocktailParams {
  name: string;
  nameZH?: string;
  category?: string;
  glass?: string;
  ice?: string;
  price?: string;
  ingredients: Ingredient[];
  method?: string;
}

/**
 * Creates a new cocktail with automatic fallback and translation logic:
 * 1. Inserts English record into `cocktails` and captures the generated ID.
 * 2. Defaults Chinese Name to English Name if left blank.
 * 3. Auto-translates fields (glass, ice, category, method, ingredients) to Traditional Chinese (zh-TW).
 * 4. Inserts into `cocktailsZH` using the EXACT SAME generated ID for 1:1 row matching.
 */
export async function createCocktailWithTranslation(
  params: CreateCocktailParams
): Promise<{ data: Cocktail | null; error: any }> {
  try {
    const englishName = params.name.trim();
    const rawChineseName = (params.nameZH || '').trim();
    // Default Chinese Name to match English Name exactly if blank
    const chineseName = rawChineseName || englishName;

    // 1. Insert into cocktails table
    const englishPayload = {
      name: englishName,
      category: params.category?.trim() || null,
      glass: params.glass?.trim() || null,
      ice: params.ice?.trim() || null,
      price: params.price?.trim() || null,
      ingredients: params.ingredients,
      instructions: params.method?.trim() || null
    };

    const { data: englishRecord, error: enError } = await supabase
      .from('cocktails')
      .insert([englishPayload])
      .select('*')
      .single();

    if (enError || !englishRecord) {
      console.error('Error inserting into cocktails table:', enError);
      return { data: null, error: enError };
    }

    const generatedId = englishRecord.id;

    // 2. Auto-translate remaining fields to Traditional Chinese (zh-TW)
    const [glassZH, iceZH, categoryZH, methodZH, ingredientsZH] = await Promise.all([
      translateToZH(params.glass),
      translateToZH(params.ice),
      translateToZH(params.category),
      translateToZH(params.method),
      translateIngredientsToZH(params.ingredients)
    ]);

    // 3. Insert into cocktailsZH table using the EXACT SAME ID
    const chinesePayload = {
      id: generatedId,
      name: chineseName,
      category: categoryZH || params.category?.trim() || null,
      glass: glassZH || params.glass?.trim() || null,
      ice: iceZH || params.ice?.trim() || null,
      price: params.price?.trim() || null,
      ingredients: ingredientsZH,
      instructions: methodZH || params.method?.trim() || null
    };

    const { error: zhError } = await supabase
      .from('cocktailsZH')
      .insert([chinesePayload]);

    if (zhError) {
      console.warn('Warning: Failed to insert into cocktailsZH table:', zhError);
    }

    const formatted: Cocktail = {
      id: englishRecord.id,
      name: englishRecord.name,
      category: englishRecord.category || '',
      glass: englishRecord.glass || '',
      ice: englishRecord.ice || '',
      price: englishRecord.price || '',
      ingredients: Array.isArray(englishRecord.ingredients) ? englishRecord.ingredients : [],
      method: englishRecord.instructions || englishRecord.method || '',
      created_at: englishRecord.created_at
    };

    return { data: formatted, error: null };
  } catch (err) {
    console.error('Error in createCocktailWithTranslation:', err);
    return { data: null, error: err };
  }
}

export async function createRecipeInSupabase(cocktail: Omit<Cocktail, 'id'>, tableName: string = 'cocktails'): Promise<{ data: Cocktail | null; error: any }> {
  return createCocktailWithTranslation({
    name: cocktail.name,
    category: cocktail.category,
    glass: cocktail.glass,
    ice: cocktail.ice,
    price: cocktail.price,
    ingredients: cocktail.ingredients,
    method: cocktail.method
  });
}

export async function updateRecipeInSupabase(id: string, cocktail: Partial<Cocktail> & { nameZH?: string }, tableName: string = 'cocktails'): Promise<{ error: any }> {
  try {
    const payloadEN: any = {};
    if (cocktail.name !== undefined) payloadEN.name = cocktail.name;
    if (cocktail.category !== undefined) payloadEN.category = cocktail.category;
    if (cocktail.glass !== undefined) payloadEN.glass = cocktail.glass;
    if (cocktail.ice !== undefined) payloadEN.ice = cocktail.ice;
    if (cocktail.price !== undefined) payloadEN.price = cocktail.price;
    if (cocktail.ingredients !== undefined) payloadEN.ingredients = cocktail.ingredients;
    if (cocktail.method !== undefined) payloadEN.instructions = cocktail.method;

    const { error: errEN } = await supabase
      .from('cocktails')
      .update(payloadEN)
      .eq('id', id);

    // Update in cocktailsZH table as well
    const payloadZH: any = {};
    if (cocktail.nameZH !== undefined && cocktail.nameZH.trim()) {
      payloadZH.name = cocktail.nameZH.trim();
    } else if (cocktail.name !== undefined) {
      payloadZH.name = cocktail.name;
    }
    if (cocktail.category !== undefined) payloadZH.category = await translateToZH(cocktail.category);
    if (cocktail.glass !== undefined) payloadZH.glass = await translateToZH(cocktail.glass);
    if (cocktail.ice !== undefined) payloadZH.ice = await translateToZH(cocktail.ice);
    if (cocktail.price !== undefined) payloadZH.price = cocktail.price;
    if (cocktail.ingredients !== undefined) payloadZH.ingredients = await translateIngredientsToZH(cocktail.ingredients);
    if (cocktail.method !== undefined) payloadZH.instructions = await translateToZH(cocktail.method);

    const { error: errZH } = await supabase
      .from('cocktailsZH')
      .update(payloadZH)
      .eq('id', id);

    return { error: errEN || errZH };
  } catch (err) {
    return { error: err };
  }
}

export async function deleteRecipeFromSupabase(id: string): Promise<{ error: any }> {
  try {
    const [resEN, resZH] = await Promise.all([
      supabase.from('cocktails').delete().eq('id', id),
      supabase.from('cocktailsZH').delete().eq('id', id)
    ]);
    return { error: resEN.error || resZH.error };
  } catch (err) {
    return { error: err };
  }
}

export async function fetchAdminPasscodeFromSupabase(): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'admin_passcode')
      .maybeSingle();

    if (!error && data && data.value) {
      return data.value;
    }
  } catch (err) {
    // Fallback to default passcode
  }
  return 'GHAdmin';
}
