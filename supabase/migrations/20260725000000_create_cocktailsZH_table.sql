-- Migration: Create cocktailsZH table for Gong High's Grog Guide (Traditional Chinese)

CREATE TABLE IF NOT EXISTS public."cocktailsZH" (
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
ALTER TABLE public."cocktailsZH" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Allow public read access on cocktailsZH" ON public."cocktailsZH";
DROP POLICY IF EXISTS "Allow public insert access on cocktailsZH" ON public."cocktailsZH";
DROP POLICY IF EXISTS "Allow public update access on cocktailsZH" ON public."cocktailsZH";
DROP POLICY IF EXISTS "Allow public delete access on cocktailsZH" ON public."cocktailsZH";

-- Create policies for public access (Anon key access)
CREATE POLICY "Allow public read access on cocktailsZH" ON public."cocktailsZH" FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on cocktailsZH" ON public."cocktailsZH" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on cocktailsZH" ON public."cocktailsZH" FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete access on cocktailsZH" ON public."cocktailsZH" FOR DELETE USING (true);
