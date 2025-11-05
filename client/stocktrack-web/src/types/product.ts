import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  price: z.coerce.number().positive('Price must be > 0'),
  stock: z.coerce.number().int('Must be an integer').nonnegative('Must be >= 0'),
});

export type ProductForm = z.infer<typeof productSchema>;

export type Product = {
  id: number;
  name: string;
  sku: string;
  price: string; // Prisma Decimal comes as string
  stock: number;
  createdAt?: string;
};
