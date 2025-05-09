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

    console.log('📤 Subiendo archivo a Google Drive:', fileMetadata.name);

    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id',
    });

    const fileId = file.data.id;
    console.log('✅ Archivo subido. ID del archivo:', fileId);

    if (!fileId) {
      throw new Error('❌ No se recibió un ID válido del archivo');
    }

    console.log('🔐 Asignando permisos públicos...');
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    const publicUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    console.log('🔗 Enlace público generado:', publicUrl);

    return publicUrl;

  } catch (error) {
    console.error('🚨 Error subiendo a Google Drive:', error.message);
    throw new Error('Falló la subida a Google Drive');
  }
}
