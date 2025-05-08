import fs from 'fs';
import { google } from 'googleapis';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const auth = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

auth.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

const drive = google.drive({ version: 'v3', auth });

export async function uploadToGoogleDrive(filePath) {
  try {
    const fileMetadata = {
      name: path.basename(filePath),
      parents: [process.env.GOOGLE_FOLDER_ID || 'root'],
    };

    const media = {
      mimeType: 'application/pdf',
      body: fs.createReadStream(filePath),
    };

    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id',
    });

    const fileId = file.data.id;

    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    const publicUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    return publicUrl;

  } catch (error) {
    console.error('Error subiendo a Google Drive:', error.message);
    throw new Error('Falló la subida a Google Drive');
  }
}

