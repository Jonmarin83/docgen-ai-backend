import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

const drive = google.drive({ version: 'v3', auth: oauth2Client });

export async function uploadToDrive(filePath, fileName, mimeType = 'application/pdf') {
  const fileMetadata = {
    name: fileName
  };
  const media = {
    mimeType,
    body: fs.createReadStream(filePath)
  };

  try {
    const response = await drive.files.create({
      resource: fileMetadata,
      media,
      fields: 'id, webViewLink, webContentLink'
    });
    return {
      success: true,
      id: response.data.id,
      viewLink: response.data.webViewLink,
      downloadLink: response.data.webContentLink
    };
  } catch (error) {
    console.error('❌ Error uploading to Google Drive:', error.message);
    return { success: false, error: error.message };
  }
}
