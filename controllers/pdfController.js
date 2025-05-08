import fs from 'fs/promises';
import path from 'path';
import handlebars from 'handlebars';
import puppeteer from 'puppeteer';
import { v4 as uuidv4 } from 'uuid';

const OUTPUT_DIR = path.resolve('./public');

export async function generatePDF(req, res) {
  const { titulo, descripcion, imagenUrl } = req.body;

  try {
    // Cargar plantilla
    const templatePath = path.join('templates', 'brochure.hbs');
    const htmlRaw = await fs.readFile(templatePath, 'utf-8');
    const template = handlebars.compile(htmlRaw);
    const html = template({ titulo, descripcion, imagenUrl });

    // Lanzar puppeteer y generar PDF
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html);
    const filename = `${uuidv4()}.pdf`;
    const filepath = path.join(OUTPUT_DIR, filename);

    await page.pdf({ path: filepath, format: 'A4', printBackground: true });
    await browser.close();

    const downloadUrl = `https://magicdesign-ai-render-server.onrender.com/public/${filename}`;
    res.status(200).json({ downloadUrl });
  } catch (err) {
    console.error('Error al generar PDF:', err);
    res.status(500).json({ error: 'Error al generar PDF' });
  }
}
