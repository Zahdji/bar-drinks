-- Migration: Add check constraint for category in cocktails table
-- Strictly accepts 'Stirred', 'Shaken', 'Bomb', 'Shot', or NULL (empty)

ALTER TABLE public.cocktails
  DROP CONSTRAINT IF EXISTS cocktails_category_check;

ALTER TABLE public.cocktails
  ADD CONSTRAINT cocktails_category_check
  CHECK (category IS NULL OR category IN ('Stirred', 'Shaken', 'Bomb', 'Shot'));

-- Fallback check constraint for legacy recipes table
ALTER TABLE public.recipes
  DROP CONSTRAINT IF EXISTS recipes_category_check;

ALTER TABLE public.recipes
  ADD CONSTRAINT recipes_category_check
  CHECK (category IS NULL OR category IN ('Stirred', 'Shaken', 'Bomb', 'Shot'));
