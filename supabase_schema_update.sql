-- Supabase Schema Update for Shared Link Tracking
-- Add tracking fields to manageshare table

ALTER TABLE manageshare 
ADD COLUMN IF NOT EXISTS shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_accessed TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS access_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_duration INTEGER DEFAULT 0, -- in seconds
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS access_logs JSONB DEFAULT '[]'::jsonb;

-- Create shared_link_access_logs table for detailed tracking
CREATE TABLE IF NOT EXISTS shared_link_access_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  share_id UUID REFERENCES manageshare(id) ON DELETE CASCADE,
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  duration INTEGER DEFAULT 0, -- session duration in seconds
  accessed_emails TEXT[], -- which emails were viewed in this session
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_shared_link_access_logs_share_id ON shared_link_access_logs(share_id);
CREATE INDEX IF NOT EXISTS idx_shared_link_access_logs_accessed_at ON shared_link_access_logs(accessed_at);

-- Add RLS policies for shared_link_access_logs
ALTER TABLE shared_link_access_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view access logs for their own shared links
CREATE POLICY "Users can view own shared link access logs" ON shared_link_access_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM manageshare 
    WHERE manageshare.id = shared_link_access_logs.share_id 
    AND manageshare.prof_id = auth.uid()
  )
);

-- Policy: Allow inserts for tracking (no auth required for public shared links)
CREATE POLICY "Allow access log inserts" ON shared_link_access_logs
FOR INSERT WITH CHECK (true);

-- Update existing manageshare records to have shared_at timestamps
UPDATE manageshare 
SET shared_at = created_at 
WHERE shared_at IS NULL AND created_at IS NOT NULL;