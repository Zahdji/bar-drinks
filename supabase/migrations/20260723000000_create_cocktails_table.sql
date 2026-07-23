-- Migration: Create cocktails table for Gong High's Grog Guide (ghcocktails-db)

CREATE TABLE IF NOT EXISTS public.cocktails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  glass TEXT,
  ice TEXT,
  ingredients JSONB DEFAULT '[]'::jsonb,
  instructions TEXT,
  garnish TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.cocktails ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Allow public read access on cocktails" ON public.cocktails;
DROP POLICY IF EXISTS "Allow public insert access on cocktails" ON public.cocktails;
DROP POLICY IF EXISTS "Allow public update access on cocktails" ON public.cocktails;
DROP POLICY IF EXISTS "Allow public delete access on cocktails" ON public.cocktails;

-- Create policies for public access (Anon key access)
CREATE POLICY "Allow public read access on cocktails" ON public.cocktails FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on cocktails" ON public.cocktails FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on cocktails" ON public.cocktails FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete access on cocktails" ON public.cocktails FOR DELETE USING (true);

-- Legacy/Fallback recipes table
CREATE TABLE IF NOT EXISTS public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  glass TEXT,
  ice TEXT,
  ingredients JSONB DEFAULT '[]'::jsonb,
  garnish TEXT,
  method TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on recipes" ON public.recipes;
DROP POLICY IF EXISTS "Allow public insert access on recipes" ON public.recipes;
DROP POLICY IF EXISTS "Allow public update access on recipes" ON public.recipes;
DROP POLICY IF EXISTS "Allow public delete access on recipes" ON public.recipes;

CREATE POLICY "Allow public read access on recipes" ON public.recipes FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on recipes" ON public.recipes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on recipes" ON public.recipes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete access on recipes" ON public.recipes FOR DELETE USING (true);
