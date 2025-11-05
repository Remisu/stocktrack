import { Router } from 'express';
import multer from 'multer';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3, S3_BUCKET } from '../s3';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from './requireAuth';
import { logAction } from '../utils/logger';

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
    if (!process.env.S3_ENDPOINT || !process.env.S3_ACCESS_KEY || !process.env.S3_SECRET_KEY || !process.env.S3_BUCKET) {
      return res.status(503).json({ error: 'storage_not_configured', detail: 'Object storage (MinIO/S3) is not configured on this environment.' });
    }
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

    // Generate public URL for the object
    const publicUrl = `${process.env.S3_ENDPOINT?.replace('9000', '9000')}/${S3_BUCKET}/${key}`;

    const updated = await prisma.product.update({
      where: { id },
      data: { imageUrl: publicUrl }
    });

    await logAction({
      reqUserId: req.user?.id,
      action: 'product.upload',
      entity: 'product',
      entityId: id,
      payload: { imageUrl: publicUrl, mimetype: req.file.mimetype, size: req.file.size },
    });

    return res.json({ ok: true, imageUrl: updated.imageUrl });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: 'upload failed', detail: e?.message });
  }
});

export default router;
