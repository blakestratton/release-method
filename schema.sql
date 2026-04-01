-- ============================================================
-- Release Method — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name           TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  -- Phase 2 fields (create now, populate later)
  key_tier            TEXT DEFAULT 'bronze',
  next_coaching_call  TIMESTAMPTZ,
  coach_notes         TEXT
);

-- Conversations (one per session)
CREATE TABLE conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  -- Phase 2 fields
  session_number  INTEGER,
  charge_before   INTEGER CHECK (charge_before BETWEEN 0 AND 10),
  charge_after    INTEGER CHECK (charge_after BETWEEN 0 AND 10),
  attachment_text TEXT
);

-- Messages (individual turns within a conversation)
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  role            TEXT CHECK (role IN ('user', 'assistant')) NOT NULL,
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Post-session forms (Phase 2 — table ready, UI built later)
CREATE TABLE post_session_forms (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  charge_before   INTEGER CHECK (charge_before BETWEEN 0 AND 10),
  charge_after    INTEGER CHECK (charge_after BETWEEN 0 AND 10),
  life_shift_note TEXT,
  completed_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Attachment inventory (Phase 2 — coach-managed queue)
CREATE TABLE attachment_inventory (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  text        TEXT NOT NULL,
  priority    BOOLEAN DEFAULT FALSE,
  added_by    TEXT CHECK (added_by IN ('coach', 'client')) DEFAULT 'coach',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Indexes (for Phase 2 dashboard queries)
-- ============================================================
CREATE INDEX conversations_user_id_idx ON conversations (user_id);
CREATE INDEX conversations_updated_at_idx ON conversations (updated_at DESC);
CREATE INDEX messages_conversation_id_idx ON messages (conversation_id);
CREATE INDEX messages_created_at_idx ON messages (created_at ASC);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_session_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachment_inventory ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only read/update their own row
CREATE POLICY "profiles_own" ON profiles
  FOR ALL USING (id = auth.uid());

-- Conversations: users can only access their own
CREATE POLICY "conversations_own" ON conversations
  FOR ALL USING (user_id = auth.uid());

-- Messages: scoped through conversation ownership
CREATE POLICY "messages_own" ON messages
  FOR ALL USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );

-- Post-session forms: own only
CREATE POLICY "forms_own" ON post_session_forms
  FOR ALL USING (user_id = auth.uid());

-- Inventory: own only
CREATE POLICY "inventory_own" ON attachment_inventory
  FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- Auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
