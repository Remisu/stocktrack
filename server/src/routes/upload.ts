import { Router } from 'express';
import multer from 'multer';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3, S3_BUCKET } from '../s3';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from './requireAuth';

const prisma = new PrismaClient();
const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  }
});

router.post('/api/products/:id/image', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' });
    if (!req.file) return res.status(400).json({ error: 'file is required' });

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return res.status(404).json({ error: 'product not found' });

    const ext = req.file.originalname.split('.').pop() || 'jpg';
    const key = `products/${id}/${Date.now()}.${ext}`;

    await s3.send(new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype
    }));

    // Gera URL pública do objeto
    const publicUrl = `${process.env.S3_ENDPOINT?.replace('9000', '9000')}/${S3_BUCKET}/${key}`;

    const updated = await prisma.product.update({
      where: { id },
      data: { imageUrl: publicUrl }
    });

    return res.json({ ok: true, imageUrl: updated.imageUrl });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: 'upload failed', detail: e?.message });
  }
});

export default router;