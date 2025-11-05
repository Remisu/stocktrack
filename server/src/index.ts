import multerLib from 'multer';
import type { MulterError } from 'multer';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import authRouter from './routes/auth';
import { requireAuth } from './routes/requireAuth';
import uploadRouter from './routes/upload';
import { logAction } from './utils/logger';

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
app.use(uploadRouter); // image upload routes

// Healthcheck
app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, db: 'up' });
  } catch {
    res.status(503).json({ ok: false, db: 'down', detail: 'Database is not reachable' });
  }
});

// Products
app.get('/api/products', async (_req, res) => {
  const products = await prisma.product.findMany({ orderBy: { id: 'desc' } });
  res.json(products);
});

// Create product (protected)
app.post('/api/products', requireAuth, async (req, res) => {
  const { name, sku, price, stock } = req.body;
  const created = await prisma.product.create({ data: { name, sku, price, stock } });
  await logAction({
    reqUserId: req.user?.id,
    action: 'product.create',
    entity: 'product',
    entityId: created.id,
    payload: { name, sku, price, stock },
  });
  res.status(201).json(created);
});

// === Logs (list) ===
app.get('/api/logs', requireAuth, async (req, res) => {
  const take = Math.min(Number(req.query.take) || 50, 100);
  const skip = Number(req.query.skip) || 0;
  const logs = await prisma.log.findMany({
    orderBy: { createdAt: 'desc' },
    take, skip,
    include: { user: { select: { id: true, email: true } } },
  });
  res.json(logs);
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
  await logAction({
    reqUserId: req.user?.id,
    action: 'product.update',
    entity: 'product',
    entityId: id,
    payload: { name, sku, price, stock },
  });

  return res.json(updated);
});

// Delete product (protected)
app.delete('/api/products/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' });
  await prisma.product.delete({ where: { id } });
  await logAction({
    reqUserId: req.user?.id,
    action: 'product.delete',
    entity: 'product',
    entityId: id,
  });
  return res.status(204).send();
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => console.log(`API on http://localhost:${port}`));
