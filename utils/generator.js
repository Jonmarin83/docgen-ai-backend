const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { uploadToDrive } = require('./driveUploader');
const puppeteer = require('puppeteer');
const { Document, Packer, Paragraph, HeadingLevel } = require('docx');
const ExcelJS = require('exceljs');
const pptxgen = require('pptxgenjs');

async function generateDocument({ type, content, filename = 'documento' }) {
  const id = uuidv4();
  const ext = type.toLowerCase();
  const outputPath = path.join(__dirname, '..', 'output', `${filename || id}.${ext}`);

  if (!fs.existsSync(path.dirname(outputPath))) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  }

  switch (ext) {
    case 'pdf':
      await generatePDF(content, outputPath);
      break;
    case 'docx':
      await generateDOCX(content, outputPath);
      break;
    case 'xlsx':
      await generateXLSX(content, outputPath);
      break;
    case 'pptx':
      await generatePPTX(content, outputPath);
      break;
    case 'png':
    case 'jpg':
      await generateImage(content, outputPath, ext);
      break;
    default:
      throw new Error(`Tipo de documento no soportado aún: ${ext}`);
  }

  const result = await uploadToDrive(outputPath);
  return result;
}

async function generatePDF(content, outputPath) {
  const html = `
    <html><head><meta charset="utf-8"></head><body>
    <h1>${content.title || 'Documento PDF'}</h1>
    ${(content.sections || []).map(s => `<h2>${s.heading}</h2><p>${s.body}</p>`).join('')}
    </body></html>
  `;

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.pdf({ path: outputPath, format: 'A4' });
  await browser.close();
}

async function generateDOCX(content, outputPath) {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          ...(content.title
            ? [new Paragraph({ text: content.title, heading: HeadingLevel.HEADING_1 })]
            : []),
          ...(content.sections || []).flatMap(section => [
            new Paragraph({ text: section.heading || '', heading: HeadingLevel.HEADING_2 }),
            new Paragraph(section.body || '')
          ])
        ]
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
}

async function generateXLSX(content, outputPath) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(content.title || 'Hoja 1');

  if (content.table?.headers) {
    sheet.addRow(content.table.headers);
  }

  (content.table?.rows || []).forEach(row => {
    sheet.addRow(row);
  });

  await workbook.xlsx.writeFile(outputPath);
}

async function generatePPTX(content, outputPath) {
  const pptx = new pptxgen();
  pptx.defineLayout({ name: 'A4', width: 8.27, height: 11.69 });
  pptx.layout = 'A4';

  const slide = pptx.addSlide();
  slide.addText(content.title || 'Presentación', { x: 1, y: 0.5, fontSize: 24 });

  (content.sections || []).forEach(section => {
    const s = pptx.addSlide();
    s.addText(section.heading || '', { x: 0.5, y: 0.5, fontSize: 20, bold: true });
    s.addText(section.body || '', { x: 0.5, y: 1.2, fontSize: 14 });
  });

  await pptx.writeFile({ fileName: outputPath });
}

async function generateImage(content, outputPath, format) {
  const html = `
    <html><head><meta charset="utf-8"></head><body>
    <h1>${content.title || 'Imagen generada'}</h1>
    ${(content.sections || []).map(s => `<h2>${s.heading}</h2><p>${s.body}</p>`).join('')}
    </body></html>
  `;

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 1000 });
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: outputPath, type: format });
  await browser.close();
}

module.exports = { generateDocument };

