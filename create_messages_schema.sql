-- WhatsApp Messages and Engagement Schema
-- Run this in Supabase SQL Editor

-- Table for storing WhatsApp messages
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_phone TEXT,
  message_content TEXT,
  message_type TEXT DEFAULT 'text', -- text, image, video, poll, system
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  is_matched BOOLEAN DEFAULT FALSE, -- whether sender was matched to a member
  raw_line TEXT, -- original line from WhatsApp export
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for tracking message reactions
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES whatsapp_messages(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  reactor_name TEXT NOT NULL,
  reaction_emoji TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for engagement metrics (aggregated stats per member)
CREATE TABLE IF NOT EXISTS engagement_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE UNIQUE,

  -- Message counts
  total_messages INTEGER DEFAULT 0,
  messages_this_month INTEGER DEFAULT 0,
  messages_last_month INTEGER DEFAULT 0,

  -- Reaction counts
  total_reactions INTEGER DEFAULT 0,
  reactions_this_month INTEGER DEFAULT 0,
  reactions_last_month INTEGER DEFAULT 0,

  -- Engagement score (0-100)
  engagement_score INTEGER DEFAULT 0,

  -- Behavior classification (for future AI analysis)
  behavior_type TEXT, -- curious, contributing, encouraging, quiet, champion

  -- Timestamps
  first_message_at TIMESTAMP WITH TIME ZONE,
  last_message_at TIMESTAMP WITH TIME ZONE,
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_member_id ON whatsapp_messages(member_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON whatsapp_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_sender_name ON whatsapp_messages(sender_name);
CREATE INDEX IF NOT EXISTS idx_reactions_member_id ON message_reactions(member_id);
CREATE INDEX IF NOT EXISTS idx_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_engagement_member_id ON engagement_metrics(member_id);

-- Enable Row Level Security
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_metrics ENABLE ROW LEVEL SECURITY;

-- Policies (allow all operations for MVP)
DROP POLICY IF EXISTS "Allow all operations on messages" ON whatsapp_messages;
CREATE POLICY "Allow all operations on messages" ON whatsapp_messages
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on reactions" ON message_reactions;
CREATE POLICY "Allow all operations on reactions" ON message_reactions
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on engagement" ON engagement_metrics;
CREATE POLICY "Allow all operations on engagement" ON engagement_metrics
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to update engagement metrics timestamp
CREATE OR REPLACE FUNCTION update_engagement_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_engagement_metrics_updated_at ON engagement_metrics;
CREATE TRIGGER update_engagement_metrics_updated_at
  BEFORE UPDATE ON engagement_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_engagement_updated_at();
