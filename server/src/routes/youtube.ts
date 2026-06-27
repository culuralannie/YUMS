import express from 'express';
import { google } from 'googleapis';
import { supabase } from '../lib/supabase';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Get OAuth URL to link a channel
router.get('/auth-url', requireAuth, (req: AuthRequest, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly'
    ],
    prompt: 'consent',
    state: req.user.id // Pass user ID as state to know who linked the channel
  });
  res.json({ url });
});

// Callback for OAuth
router.get('/callback', async (req, res) => {
  console.log('OAuth Callback Hit! Full URL:', req.originalUrl);
  console.log('OAuth Callback Query Params:', req.query);

  const errorParam = req.query.error as string;
  if (errorParam) {
    return res.status(400).send(`Google returned an error: ${errorParam}. Did you check all the boxes on the consent screen?`);
  }

  const code = req.query.code as string;
  const userId = req.query.state as string;

  if (!code) {
    return res.status(400).send('Missing code parameter from Google. Query was: ' + JSON.stringify(req.query));
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get channel info
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    const response = await youtube.channels.list({
      part: ['snippet'],
      mine: true,
    });

    const channelInfo = response.data.items?.[0];
    if (!channelInfo) {
      return res.status(404).send('YouTube channel not found');
    }

    // Save tokens and channel to database
    const { data: channel, error } = await supabase
      .from('channels')
      .upsert({
        youtube_channel_id: channelInfo.id,
        name: channelInfo.snippet?.title || 'Unknown Channel',
        oauth_tokens: tokens,
      }, { onConflict: 'youtube_channel_id' })
      .select()
      .single();

    if (error || !channel) {
      console.error('Error saving channel:', error);
      return res.status(500).send('Database error saving channel');
    }

    // Link channel to user if userId is provided
    if (userId) {
      await supabase
        .from('user_channels')
        .upsert({ user_id: userId, channel_id: channel.id });
    }

    // Redirect back to frontend
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?linked=true`);
  } catch (error: any) {
    console.error('Error during OAuth callback:', error);
    res.status(500).send(`Authentication failed! Error: ${error.message} - Stack: ${error.stack}`);
  }
});

export default router;
