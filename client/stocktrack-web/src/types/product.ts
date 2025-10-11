import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  sku: z.string().min(1, 'SKU obrigatório'),
  price: z.coerce.number().positive('Preço deve ser > 0'),
  stock: z.coerce.number().int('Número inteiro').nonnegative('>= 0'),
});

export type ProductForm = z.infer<typeof productSchema>;

export type Product = {
  id: number;
  name: string;
  sku: string;
  price: string; // Prisma Decimal vem como string
  stock: number;
  createdAt?: string;
};