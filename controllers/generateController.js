import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { uploadToGoogleDrive } from '../utils/GoogleDriveUploader.js';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import handlebars from 'handlebars';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = path.resolve(__dirname, '../templates/brochure.hbs');
const OUTPUT_DIR = path.resolve('./public');

export async function generateDocument(req, res) {
  const { type, data } = req.body;

  if (type !== 'pdf') {
    return res.status(400).json({ error: 'Sólo se admite el tipo "pdf" por ahora' });
  }

  const filename = `${uuidv4()}.pdf`;
  const filepath = path.join(OUTPUT_DIR, filename);

  try {
    // 1. Cargar y compilar plantilla
    const templateContent = await fs.readFile(TEMPLATE_PATH, 'utf8');
    const compiledTemplate = handlebars.compile(templateContent);
    const html = compiledTemplate(data);

    // 2. Usar Puppeteer para generar PDF
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({ path: filepath, format: 'A4', printBackground: true });
    await browser.close();

    // 3. Subir a Google Drive
    const driveUrl = await uploadToGoogleDrive(filepath);
    await fs.unlink(filepath);

    return res.status(200).json({ downloadUrl: driveUrl });

  } catch (err) {
    console.error('Error al generar PDF:', err);
    return res.status(500).json({ error: 'Error generando PDF' });
  }
}
