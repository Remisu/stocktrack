import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import authRouter from './routes/auth';
import { requireAuth } from './routes/requireAuth';

const app = express();
app.use(cors());
app.use(express.json());

const prisma = new PrismaClient();

// Optional root message to avoid "Cannot GET /"
app.get('/', (_req, res) => {
  res.send('StockTrack API is running. Try GET /api/health');
});

// Auth routes
app.use(authRouter);

// Healthcheck
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Products
app.get('/api/products', async (_req, res) => {
  const products = await prisma.product.findMany({ orderBy: { id: 'desc' } });
  res.json(products);
});

// Create product (protected)
app.post('/api/products', requireAuth, async (req, res) => {
  const { name, sku, price, stock } = req.body;
  const created = await prisma.product.create({ data: { name, sku, price, stock } });
  res.status(201).json(created);
});

// Update product (protected)
app.put('/api/products/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' });

  const { name, sku, price, stock } = req.body as {
    name?: string; sku?: string; price?: number; stock?: number;
  };

  const updated = await prisma.product.update({
    where: { id },
    data: { name, sku, price, stock }
  });

  return res.json(updated);
});

// Delete product (protected)
app.delete('/api/products/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' });
  await prisma.product.delete({ where: { id } });
  return res.status(204).send();
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => console.log(`API on http://localhost:${port}`));