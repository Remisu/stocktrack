import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
app.use(cors());
app.use(express.json());
app.get('/', (_req, res) => {
  res.send('StockTrack API está rodando. Use /api/health');
});
const prisma = new PrismaClient();

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get('/api/products', async (_req, res) => {
  const products = await prisma.product.findMany({ orderBy: { id: 'desc' } });
  res.json(products);
});

app.post('/api/products', async (req, res) => {
  const { name, sku, price, stock } = req.body;
  const created = await prisma.product.create({ data: { name, sku, price, stock } });
  res.status(201).json(created);
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => console.log(`API on http://localhost:${port}`));