import express from 'express';
import dotenv from 'dotenv';
import renderRoutes from './routes/render.js';
import generateRoutes from './routes/generate.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json({ limit: '5mb' }));

// Rutas
app.use('/render', renderRoutes);
app.use('/generate', generateRoutes);

// Inicializar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});