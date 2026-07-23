-- Create recipes table
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

-- Enable Row Level Security
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (Anon key access)
CREATE POLICY "Allow public read access" ON public.recipes FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.recipes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.recipes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete access" ON public.recipes FOR DELETE USING (true);
