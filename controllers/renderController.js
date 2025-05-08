import puppeteer from 'puppeteer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import cloudinary from '../utils/cloudinary.js';
import { Document, Packer, Paragraph } from 'docx';
import PptxGenJS from 'pptxgenjs';
import ExcelJS from 'exceljs';

const OUTPUT_DIR = path.resolve('./public');

export async function renderHTML(req, res) {
  const { html, outputType, content } = req.body;

  if (!outputType) {
    return res.status(400).json({ error: 'outputType es requerido (pdf, png, docx, pptx, xlsx, txt, csv)' });
  }

  const filename = `${uuidv4()}.${outputType}`;
  const filepath = path.join(OUTPUT_DIR, filename);

  try {
    // 🟠 PDF y PNG (con Puppeteer)
    if (outputType === 'pdf' || outputType === 'png') {
      if (!html) return res.status(400).json({ error: 'html es requerido para PDF o PNG' });

      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      if (outputType === 'pdf') {
        await page.pdf({ path: filepath, format: 'A4', printBackground: true });
      } else {
        await page.screenshot({ path: filepath, fullPage: true });
      }

      await browser.close();

      // Subir a Cloudinary (tipo raw o image)
      const upload = await cloudinary.uploader.upload(filepath, {
        resource_type: outputType === 'pdf' ? 'raw' : 'image',
        folder: 'magicdesign-ai'
      });

      await fs.unlink(filepath);
      return res.status(200).json({ downloadUrl: upload.secure_url });
    }

    // 🟠 DOCX
    if (outputType === 'docx') {
      const doc = new Document();
      doc.addSection({ children: [new Paragraph(content || 'Documento generado')] });
      const buffer = await Packer.toBuffer(doc);
      await fs.writeFile(filepath, buffer);
    }

    // 🟠 PPTX
    else if (outputType === 'pptx') {
      const pptx = new PptxGenJS();
      const slide = pptx.addSlide();
      slide.addText(content || 'Presentación generada', { x: 1, y: 1, fontSize: 24 });
      await pptx.writeFile({ fileName: filepath });
    }

    // 🟠 XLSX
    else if (outputType === 'xlsx') {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Hoja 1');
      sheet.addRow([content || 'Dato generado']);
      await workbook.xlsx.writeFile(filepath);
    }

    // 🟠 TXT
    else if (outputType === 'txt') {
      await fs.writeFile(filepath, content || 'Texto generado');
    }

    // 🟠 CSV
    else if (outputType === 'csv') {
      await fs.writeFile(filepath, content || 'columna1,columna2\nvalor1,valor2');
    }

    else {
      return res.status(400).json({ error: `outputType no soportado: ${outputType}` });
    }

    // 🌐 Enlace directo desde Render (para tipos no compatibles con Cloudinary)
    const publicUrl = `${process.env.BASE_URL || 'https://magicdesign-ai-render-server.onrender.com'}/public/${filename}`;
    return res.status(200).json({ downloadUrl: publicUrl });

  } catch (error) {
    console.error('Error al generar archivo:', error);
    res.status(500).json({ error: 'Error interno al generar archivo' });
  }
}
