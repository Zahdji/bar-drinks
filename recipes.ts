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
}

export const initialRecipes: Cocktail[] = [
  {
    id: "old-fashioned",
    name: "Old Fashioned",
    glass: "Rocks / Lowball Glass",
    ice: "Single Large Cube",
    category: "Stirred",
    ingredients: [
      { name: "Bourbon or Rye Whiskey", amount: "2 oz (60 ml)" },
      { name: "Angostura Bitters", amount: "2-3 dashes" },
      { name: "Sugar Cube / Simple Syrup", amount: "1 cube or 0.25 oz" },
      { name: "Water / Ice Splash", amount: "Splash" }
    ],
    method: "Muddle sugar cube with bitters and splash of water in rocks glass until dissolved. Add large ice cube and whiskey. Stir gently for 20-30 seconds to chill.",
    garnish: "Express orange peel oils over glass and drop into drink with a Luxardo cherry."
  },
  {
    id: "negroni",
    name: "Negroni",
    glass: "Rocks / Lowball Glass",
    ice: "Large Sphere or Cubed",
    category: "Stirred",
    ingredients: [
      { name: "London Dry Gin", amount: "1 oz (30 ml)" },
      { name: "Campari", amount: "1 oz (30 ml)" },
      { name: "Sweet Red Vermouth", amount: "1 oz (30 ml)" }
    ],
    method: "Combine gin, Campari, and sweet vermouth in a mixing glass with ice. Stir thoroughly for 20-30 seconds. Strain over a single large ice sphere in a rocks glass.",
    garnish: "Fresh orange slice or orange twist."
  },
  {
    id: "margarita",
    name: "Margarita",
    glass: "Rocks or Coupe Glass",
    ice: "Fresh Cubed Ice",
    category: "Shaken",
    ingredients: [
      { name: "Blanco Tequila", amount: "2 oz (60 ml)" },
      { name: "Fresh Lime Juice", amount: "1 oz (30 ml)" },
      { name: "Cointreau / Triple Sec", amount: "0.75 oz (22.5 ml)" },
      { name: "Agave Nectar", amount: "0.25 oz (7.5 ml)" }
    ],
    method: "Combine all ingredients in a cocktail shaker filled with ice. Shake vigorously for 12 seconds. Double strain into ice-filled rocks glass with a half-salted rim.",
    garnish: "Fresh lime wheel & kosher salt rim."
  },
  {
    id: "daiquiri",
    name: "Daiquiri",
    glass: "Chilled Coupe Glass",
    ice: "None (Served Straight Up)",
    category: "Shaken",
    ingredients: [
      { name: "White Rum", amount: "2 oz (60 ml)" },
      { name: "Fresh Lime Juice", amount: "1 oz (30 ml)" },
      { name: "Rich Simple Syrup (2:1)", amount: "0.75 oz (22.5 ml)" }
    ],
    method: "Add rum, lime juice, and simple syrup to a shaker with plenty of ice. Shake hard for 10-15 seconds until outer shaker is frosty. Fine strain into a chilled coupe glass.",
    garnish: "Lime wheel or lime twist."
  },
  {
    id: "manhattan",
    name: "Manhattan",
    glass: "Coupe or Nick & Nora Glass",
    ice: "None (Served Straight Up)",
    category: "Stirred",
    ingredients: [
      { name: "Rye Whiskey", amount: "2 oz (60 ml)" },
      { name: "Sweet Red Vermouth", amount: "1 oz (30 ml)" },
      { name: "Angostura Bitters", amount: "2 dashes" }
    ],
    method: "Pour rye, sweet vermouth, and bitters into mixing glass filled with ice. Stir smoothly for 30 seconds until ice cold. Strain into pre-chilled coupe glass.",
    garnish: "Brandied Luxardo cherry."
  },
  {
    id: "espresso-martini",
    name: "Espresso Martini",
    glass: "Chilled Coupe Glass",
    ice: "None (Served Straight Up)",
    category: "Shaken",
    ingredients: [
      { name: "Vodka", amount: "1.5 oz (45 ml)" },
      { name: "Coffee Liqueur (Kahlúa)", amount: "0.75 oz (22.5 ml)" },
      { name: "Freshly Brewed Espresso", amount: "1 oz (30 ml)" },
      { name: "Simple Syrup", amount: "0.25 oz (7.5 ml)" }
    ],
    method: "Combine vodka, coffee liqueur, fresh warm espresso, and syrup in a shaker with fresh ice. Shake hard and fast for maximum crema foam. Fine strain quickly into a chilled coupe glass.",
    garnish: "3 floating coffee beans."
  }
];

// Supabase API Helpers
export async function fetchRecipesFromSupabase(): Promise<{ data: Cocktail[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch error:', error.message);
      return { data: null, error };
    }

    if (!data || data.length === 0) {
      return { data: null, error: null };
    }

    const formatted: Cocktail[] = data.map((item: any) => ({
      id: item.id,
      name: item.name,
      glass: item.glass || '',
      ice: item.ice || '',
      ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
      method: item.method || '',
      garnish: item.garnish || '',
      created_at: item.created_at
    }));

    return { data: formatted, error: null };
  } catch (err) {
    console.warn('Supabase request failed:', err);
    return { data: null, error: err };
  }
}

export async function createRecipeInSupabase(cocktail: Omit<Cocktail, 'id'>): Promise<{ data: Cocktail | null; error: any }> {
  try {
    const payload: RecipeRow = {
      name: cocktail.name,
      glass: cocktail.glass,
      ice: cocktail.ice,
      ingredients: cocktail.ingredients,
      garnish: cocktail.garnish,
      method: cocktail.method
    };

    const { data, error } = await supabase
      .from('recipes')
      .insert([payload])
      .select('*')
      .single();

    if (error) return { data: null, error };

    const formatted: Cocktail = {
      id: data.id,
      name: data.name,
      glass: data.glass || '',
      ice: data.ice || '',
      ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
      method: data.method || '',
      garnish: data.garnish || '',
      created_at: data.created_at
    };

    return { data: formatted, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function updateRecipeInSupabase(id: string, cocktail: Partial<Cocktail>): Promise<{ error: any }> {
  try {
    const payload: Partial<RecipeRow> = {};
    if (cocktail.name !== undefined) payload.name = cocktail.name;
    if (cocktail.glass !== undefined) payload.glass = cocktail.glass;
    if (cocktail.ice !== undefined) payload.ice = cocktail.ice;
    if (cocktail.ingredients !== undefined) payload.ingredients = cocktail.ingredients;
    if (cocktail.garnish !== undefined) payload.garnish = cocktail.garnish;
    if (cocktail.method !== undefined) payload.method = cocktail.method;

    const { error } = await supabase
      .from('recipes')
      .update(payload)
      .eq('id', id);

    return { error };
  } catch (err) {
    return { error: err };
  }
}

export async function deleteRecipeFromSupabase(id: string): Promise<{ error: any }> {
  try {
    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', id);

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

