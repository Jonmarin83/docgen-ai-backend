const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const oauth2Client = require('./googleAuthClient');

const drive = google.drive({ version: 'v3', auth: oauth2Client });

async function uploadToDrive(filePath) {
  const fileName = path.basename(filePath);
  const mimeType = getMimeType(fileName);

  const fileMetadata = {
    name: fileName,
  };

  const media = {
    mimeType,
    body: fs.createReadStream(filePath),
  };

  const response = await drive.files.create({
    resource: fileMetadata,
    media,
    fields: 'id',
  });

  const fileId = response.data.id;

  // Hacer público el archivo
  await drive.permissions.create({
    fileId,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  });

  const publicUrl = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;

  return { publicUrl, fileId };
}

function getMimeType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  switch (ext) {
    case '.pdf': return 'application/pdf';
    case '.docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case '.xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case '.pptx': return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    default: return 'application/octet-stream';
  }
}

module.exports = { uploadToDrive };
