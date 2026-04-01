-- ============================================================
-- Release Method — Phase 2 Schema Additions
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- Safe to run on top of the existing schema
-- ============================================================

-- Add resources URL to profiles (links to client's Google Drive folder)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS resources_url TEXT;

-- Life notes and wins (added by coach, read-only for clients)
CREATE TABLE IF NOT EXISTS life_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content     TEXT NOT NULL,
  type        TEXT CHECK (type IN ('note', 'win')) DEFAULT 'note',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE life_notes ENABLE ROW LEVEL SECURITY;

-- Clients can only READ their own life notes (coach writes via admin functions)
CREATE POLICY "life_notes_read_own" ON life_notes
  FOR SELECT USING (user_id = auth.uid());

-- Add insights capture to post-session forms
ALTER TABLE post_session_forms ADD COLUMN IF NOT EXISTS insights TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS life_notes_user_id_idx ON life_notes (user_id);
CREATE INDEX IF NOT EXISTS life_notes_created_at_idx ON life_notes (created_at DESC);
