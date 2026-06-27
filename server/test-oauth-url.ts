import 'dotenv/config';
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const url = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.readonly'
  ],
  prompt: 'consent',
  state: "test-user-id"
});

console.log("EXACT_URL_GENERATED:\n" + url);
console.log("\nCLIENT_ID_IN_ENV:\n" + process.env.GOOGLE_CLIENT_ID);
console.log("\nREDIRECT_URI_IN_ENV:\n" + process.env.GOOGLE_REDIRECT_URI);
