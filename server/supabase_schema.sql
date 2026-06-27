-- Create users table (Extending Supabase Auth users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Uploader' CHECK (role IN ('Super Admin', 'Admin', 'Uploader')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create channels table
CREATE TABLE public.channels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  youtube_channel_id TEXT,
  oauth_tokens JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_channels table (Many-to-many relationship)
CREATE TABLE public.user_channels (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, channel_id)
);

-- Create videos table
CREATE TABLE public.videos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT[],
  playlist_id TEXT,
  made_for_kids BOOLEAN DEFAULT FALSE,
  visibility TEXT NOT NULL DEFAULT 'Private' CHECK (visibility IN ('Private', 'Unlisted', 'Public')),
  scheduled_time TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Pending', 'Uploading', 'Scheduled', 'Published', 'Failed')),
  youtube_video_id TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Setup Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Note: We will need more granular RLS policies based on roles, but for initial setup, we can allow authenticated access
CREATE POLICY "Allow authenticated access for users" ON public.users FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access for channels" ON public.channels FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access for user_channels" ON public.user_channels FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access for videos" ON public.videos FOR ALL USING (auth.role() = 'authenticated');
