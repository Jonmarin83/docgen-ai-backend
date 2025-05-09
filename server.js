const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { generateDocument } = require('./utils/generator');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('✅ DocGen API corriendo correctamente.');
});


app.post('/generate', async (req, res) => {
  try {
    const { type, content, filename } = req.body;

    if (!type || !content) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: type o content.'
      });
    }

    const result = await generateDocument({ type, content, filename });

    if (!result || !result.publicUrl) {
      throw new Error('No se pudo generar el archivo correctamente.');
    }

    res.status(200).json({
      success: true,
      url: result.publicUrl,
      fileId: result.fileId
    });
  } catch (error) {
    console.error('❌ Error al generar documento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno al generar el documento.',
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://0.0.0.0:${PORT}`);
});
