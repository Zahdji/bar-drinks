import { supabase, RecipeRow } from './lib/supabase';

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
  garnish?: string;
  created_at?: string;
  category?: string;
  price?: string;
}

export const initialRecipes: Cocktail[] = [];

// Supabase API Helpers
export async function fetchRecipesFromSupabase(tableName: string = 'cocktails'): Promise<{ data: Cocktail[] | null; error: any }> {
  try {
    let { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: false });

    if (error && tableName === 'cocktails') {
      // Fallback to legacy recipes table
      const fallback = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });
      data = fallback.data;
      error = fallback.error;
    }

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
      garnish: item.garnish || '',
      created_at: item.created_at
    }));

    return { data: formatted, error: null };
  } catch (err) {
    console.warn(`Supabase request failed on ${tableName}:`, err);
    return { data: null, error: err };
  }
}

export async function createRecipeInSupabase(cocktail: Omit<Cocktail, 'id'>, tableName: string = 'cocktails'): Promise<{ data: Cocktail | null; error: any }> {
  try {
    const payload: any = {
      name: cocktail.name,
      category: cocktail.category,
      glass: cocktail.glass,
      ice: cocktail.ice,
      price: cocktail.price,
      ingredients: cocktail.ingredients,
      instructions: cocktail.method,
      garnish: cocktail.garnish
    };

    let { data, error } = await supabase
      .from(tableName)
      .insert([payload])
      .select('*')
      .single();

    if (error && tableName === 'cocktails') {
      // Fallback to legacy recipes table
      const legacyPayload: RecipeRow = {
        name: cocktail.name,
        glass: cocktail.glass,
        ice: cocktail.ice,
        ingredients: cocktail.ingredients,
        garnish: cocktail.garnish,
        method: cocktail.method
      };
      const fallback = await supabase
        .from('recipes')
        .insert([legacyPayload])
        .select('*')
        .single();
      data = fallback.data;
      error = fallback.error;
    }

    if (error || !data) return { data: null, error };

    const formatted: Cocktail = {
      id: data.id,
      name: data.name,
      category: data.category || '',
      glass: data.glass || '',
      ice: data.ice || '',
      price: data.price || '',
      ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
      method: data.instructions || data.method || '',
      garnish: data.garnish || '',
      created_at: data.created_at
    };

    return { data: formatted, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function updateRecipeInSupabase(id: string, cocktail: Partial<Cocktail>, tableName: string = 'cocktails'): Promise<{ error: any }> {
  try {
    const payload: any = {};
    if (cocktail.name !== undefined) payload.name = cocktail.name;
    if (cocktail.category !== undefined) payload.category = cocktail.category;
    if (cocktail.glass !== undefined) payload.glass = cocktail.glass;
    if (cocktail.ice !== undefined) payload.ice = cocktail.ice;
    if (cocktail.price !== undefined) payload.price = cocktail.price;
    if (cocktail.ingredients !== undefined) payload.ingredients = cocktail.ingredients;
    if (cocktail.garnish !== undefined) payload.garnish = cocktail.garnish;
    if (cocktail.method !== undefined) payload.instructions = cocktail.method;

    let { error } = await supabase
      .from(tableName)
      .update(payload)
      .eq('id', id);

    if (error && tableName === 'cocktails') {
      // Fallback update to legacy recipes table
      const legacyPayload: Partial<RecipeRow> = {};
      if (cocktail.name !== undefined) legacyPayload.name = cocktail.name;
      if (cocktail.glass !== undefined) legacyPayload.glass = cocktail.glass;
      if (cocktail.ice !== undefined) legacyPayload.ice = cocktail.ice;
      if (cocktail.ingredients !== undefined) legacyPayload.ingredients = cocktail.ingredients;
      if (cocktail.garnish !== undefined) legacyPayload.garnish = cocktail.garnish;
      if (cocktail.method !== undefined) legacyPayload.method = cocktail.method;

      const fallback = await supabase
        .from('recipes')
        .update(legacyPayload)
        .eq('id', id);
      error = fallback.error;
    }

    return { error };
  } catch (err) {
    return { error: err };
  }
}

export async function deleteRecipeFromSupabase(id: string, tableName: string = 'cocktails'): Promise<{ error: any }> {
  try {
    let { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);

    if (error && tableName === 'cocktails') {
      const fallback = await supabase
        .from('recipes')
        .delete()
        .eq('id', id);
      error = fallback.error;
    }

    return { error };
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
