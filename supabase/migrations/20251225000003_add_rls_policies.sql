-- Migration: Add Row-Level Security policies for playspaces, events, and playspace_access

-- Enable RLS on all tables
ALTER TABLE playspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE playspace_access ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PLAYSPACES POLICIES
-- ============================================================================

-- Policy: Users can read playspaces they have access to (or default playspace)
CREATE POLICY "Users can read accessible playspaces"
  ON playspaces FOR SELECT
  USING (
    id = 1 -- Default playspace is always readable
    OR
    EXISTS (
      SELECT 1 FROM playspace_access
      WHERE playspace_access.playspace_id = playspaces.id
        AND (
          playspace_access.user_id = auth.uid()
          OR
          playspace_access.anonymous_id = current_setting('app.anonymous_id', true)
        )
    )
  );

-- Policy: Authenticated users can create playspaces
CREATE POLICY "Authenticated users can create playspaces"
  ON playspaces FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

-- Policy: Owners can update their playspaces (future feature)
CREATE POLICY "Owners can update playspaces"
  ON playspaces FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM playspace_access
      WHERE playspace_access.playspace_id = playspaces.id
        AND playspace_access.user_id = auth.uid()
        AND playspace_access.role = 'owner'
    )
  );

-- ============================================================================
-- EVENTS POLICIES
-- ============================================================================

-- Policy: Users can read events for accessible playspaces
CREATE POLICY "Users can read events for accessible playspaces"
  ON events FOR SELECT
  USING (
    playspace = 1 -- Default playspace
    OR
    EXISTS (
      SELECT 1 FROM playspace_access
      WHERE playspace_access.playspace_id = events.playspace
        AND (
          playspace_access.user_id = auth.uid()
          OR
          playspace_access.anonymous_id = current_setting('app.anonymous_id', true)
        )
    )
  );

-- Policy: Users can insert events for accessible playspaces
CREATE POLICY "Users can insert events for accessible playspaces"
  ON events FOR INSERT
  WITH CHECK (
    playspace = 1 -- Default playspace
    OR
    EXISTS (
      SELECT 1 FROM playspace_access
      WHERE playspace_access.playspace_id = events.playspace
        AND (
          playspace_access.user_id = auth.uid()
          OR
          playspace_access.anonymous_id = current_setting('app.anonymous_id', true)
        )
    )
  );

-- ============================================================================
-- PLAYSPACE_ACCESS POLICIES
-- ============================================================================

-- Policy: Users can read their own access records
CREATE POLICY "Users can read their own access"
  ON playspace_access FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    anonymous_id = current_setting('app.anonymous_id', true)
  );

-- ============================================================================
-- RPC FUNCTIONS
-- ============================================================================

-- Function: Grant access to playspace via URL visit
CREATE OR REPLACE FUNCTION grant_url_access(
  p_slug TEXT,
  p_anonymous_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_playspace_id BIGINT;
  v_user_id UUID;
BEGIN
  -- Get playspace ID from slug
  SELECT id INTO v_playspace_id FROM playspaces WHERE slug = p_slug;

  IF v_playspace_id IS NULL THEN
    RETURN FALSE; -- Invalid slug
  END IF;

  v_user_id := auth.uid();

  -- Insert access record (ignore if already exists)
  INSERT INTO playspace_access (playspace_id, user_id, anonymous_id, granted_by)
  VALUES (
    v_playspace_id,
    v_user_id,
    CASE WHEN v_user_id IS NULL THEN p_anonymous_id ELSE NULL END,
    'url_visit'
  )
  ON CONFLICT DO NOTHING;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
