import { S3Client } from '@aws-sdk/client-s3';

export const s3 = new S3Client({
  region: 'us-east-1',
  endpoint: process.env.S3_ENDPOINT, // ex.: http://localhost:9000
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
  },
  forcePathStyle: true, // obrigatório para MinIO
});

export const S3_BUCKET = process.env.S3_BUCKET || 'stocktrack-dev';