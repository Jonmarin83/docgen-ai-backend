import express from 'express';
import { renderHTML } from '../controllers/renderController.js';

const router = express.Router();
router.post('/', renderHTML);
export default router;
