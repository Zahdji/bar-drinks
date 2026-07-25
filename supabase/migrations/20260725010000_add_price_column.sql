-- Migration: Add price column to cocktails and cocktailsZH tables

ALTER TABLE public.cocktails
  ADD COLUMN IF NOT EXISTS price TEXT;

ALTER TABLE public."cocktailsZH"
  ADD COLUMN IF NOT EXISTS price TEXT;
