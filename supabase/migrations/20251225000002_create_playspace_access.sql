-- Migration: Create playspace_access junction table for permission tracking

CREATE TABLE playspace_access (
  id BIGSERIAL PRIMARY KEY,
  playspace_id BIGINT NOT NULL REFERENCES playspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  anonymous_id TEXT,
  role TEXT NOT NULL DEFAULT 'viewer',
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by TEXT,

  -- Constraint: either user_id OR anonymous_id must be set (not both)
  CONSTRAINT check_user_or_anon CHECK (
    (user_id IS NOT NULL AND anonymous_id IS NULL) OR
    (user_id IS NULL AND anonymous_id IS NOT NULL)
  ),

  -- Unique constraint: one access record per user per playspace
  CONSTRAINT unique_playspace_user UNIQUE (playspace_id, user_id),
  CONSTRAINT unique_playspace_anon UNIQUE (playspace_id, anonymous_id)
);

-- Create indexes for fast permission checks
CREATE INDEX idx_playspace_access_user ON playspace_access(user_id);
CREATE INDEX idx_playspace_access_playspace ON playspace_access(playspace_id);

-- Trigger function: Auto-grant creator access on playspace creation
CREATE OR REPLACE FUNCTION grant_creator_access()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO playspace_access (playspace_id, user_id, role, granted_by)
    VALUES (NEW.id, NEW.created_by, 'owner', 'auto_creator');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to playspaces table
CREATE TRIGGER trigger_grant_creator_access
  AFTER INSERT ON playspaces
  FOR EACH ROW
  EXECUTE FUNCTION grant_creator_access();
