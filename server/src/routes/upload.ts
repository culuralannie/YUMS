import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import { supabase } from '../lib/supabase';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for temp storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

router.post('/', requireAuth, upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), async (req: AuthRequest, res) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const videoFile = files['video']?.[0];
    const thumbnailFile = files['thumbnail']?.[0];

    const {
      channelId,
      title,
      description,
      tags,
      visibility,
      madeForKids,
      scheduledTime
    } = req.body;

    if (!videoFile || !channelId || !title) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1. Fetch channel's OAuth tokens from Supabase
    const { data: channel, error: channelError } = await supabase
      .from('channels')
      .select('oauth_tokens')
      .eq('id', channelId)
      .single();

    if (channelError || !channel || !channel.oauth_tokens) {
      return res.status(404).json({ error: 'Channel not found or not authenticated' });
    }

    // 2. Insert draft video record in DB
    const { data: videoRecord, error: dbError } = await supabase
      .from('videos')
      .insert({
        user_id: req.user.id,
        channel_id: channelId,
        title,
        description,
        tags: tags ? tags.split(',') : [],
        visibility: visibility || 'Private',
        made_for_kids: madeForKids === 'true',
        scheduled_time: scheduledTime || null,
        status: scheduledTime ? 'Scheduled' : 'Uploading'
      })
      .select()
      .single();

    if (dbError) {
      return res.status(500).json({ error: 'Database error creating video record' });
    }

    // If scheduled, we might just leave it for a cron job to pick up.
    // For "Publish Now" or basic upload flow, we upload immediately to YouTube as Private/Unlisted/Public.
    // If it's scheduled to be published later by YouTube itself, YouTube API supports setting a `publishAt` date 
    // ONLY IF the visibility is set to 'private'.
    
    // We will upload it immediately as a background task.
    res.json({ message: 'Upload started', videoId: videoRecord.id });

    // Background upload logic
    (async () => {
      try {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET
        );
        oauth2Client.setCredentials(channel.oauth_tokens as any);
        const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

        const videoMetadata: any = {
          snippet: {
            title,
            description,
            tags: tags ? tags.split(',') : [],
          },
          status: {
            privacyStatus: scheduledTime ? 'private' : visibility.toLowerCase(),
            selfDeclaredMadeForKids: madeForKids === 'true'
          }
        };

        if (scheduledTime) {
          videoMetadata.status.publishAt = new Date(scheduledTime).toISOString();
        }

        const uploadRes = await youtube.videos.insert({
          part: ['snippet', 'status'],
          requestBody: videoMetadata,
          media: {
            body: fs.createReadStream(videoFile.path),
          }
        });

        const youtubeVideoId = uploadRes.data.id;

        // Upload Thumbnail if provided
        if (thumbnailFile && youtubeVideoId) {
          await youtube.thumbnails.set({
            videoId: youtubeVideoId,
            media: {
              body: fs.createReadStream(thumbnailFile.path)
            }
          });
        }

        // Update DB
        await supabase
          .from('videos')
          .update({
            status: scheduledTime ? 'Scheduled' : 'Published',
            youtube_video_id: youtubeVideoId
          })
          .eq('id', videoRecord.id);

      } catch (uploadError: any) {
        console.error('Upload Error:', uploadError);
        await supabase
          .from('videos')
          .update({
            status: 'Failed',
            error_message: uploadError.message
          })
          .eq('id', videoRecord.id);
      } finally {
        // Cleanup temp files
        if (videoFile) fs.unlinkSync(videoFile.path);
        if (thumbnailFile) fs.unlinkSync(thumbnailFile.path);
      }
    })();

  } catch (error) {
    console.error('Error processing upload:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
