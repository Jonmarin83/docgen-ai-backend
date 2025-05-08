import express from 'express';
import { generateDocument } from '../controllers/generateController.js';
import { generatePDF } from '../controllers/pdfController.js';

const router = express.Router();

// Ruta para documentos (docx, xlsx, pptx)
router.post('/', generateDocument);

// Ruta para generar PDF a partir de plantilla
router.post('/pdf', generatePDF);

export default router;
