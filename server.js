const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Suponiendo que ya tienes esta función para generar y subir documentos
const { generateDocument } = require('./services/generator');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());

// Ruta principal para generar documentos
app.post('/generate', async (req, res) => {
  try {
    const { type, content, filename } = req.body;

    if (!type || !content) {
      return res.status(400).json({ success: false, message: 'Faltan campos requeridos: type o content.' });
    }

    console.log(`📥 Solicitud recibida para generar: ${type}`);

    const result = await generateDocument({ type, content, filename });

    if (!result || !result.publicUrl) {
      throw new Error('No se pudo generar el
