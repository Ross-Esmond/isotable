-- Migration: Add slug and owner tracking to playspaces table

-- Add new columns
ALTER TABLE playspaces
  ADD COLUMN slug TEXT UNIQUE NOT NULL DEFAULT 'temp',
  ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();

-- Create index for fast slug lookups
CREATE INDEX idx_playspaces_slug ON playspaces(slug);

-- Backfill default playspace (ID 1) with 'default' slug
UPDATE playspaces SET slug = 'default', created_by = NULL WHERE id = 1;

-- Remove default value after backfill
ALTER TABLE playspaces ALTER COLUMN slug DROP DEFAULT;
