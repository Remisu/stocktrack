import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  price: z.coerce.number().positive('Price must be > 0'),
  stock: z.coerce.number().int('Must be an integer').nonnegative('Must be >= 0'),
});
export type ProductFormValues = z.infer<typeof schema>;

type Props = {
  defaultValues?: Partial<ProductFormValues>;
  submitLabel: string;
  onSubmit: (values: ProductFormValues, file?: File | null) => Promise<void> | void;
  onCancel?: () => void;
  loading?: boolean;
  /** Shows image input and requires a file (used on create) */
  requireImage?: boolean;
  /** Makes the SKU field read-only (used when auto-generated) */
  lockSku?: boolean;
  /** Optional helper text below the SKU field */
  skuNote?: string;
};

export default function ProductForm({
  defaultValues,
  submitLabel,
  onSubmit,
  onCancel,
  loading,
  requireImage,
  lockSku,
  skuNote,
}: Props) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: defaultValues?.name ?? '',
      sku: defaultValues?.sku ?? '',
      price: defaultValues?.price ?? ('' as unknown as number),
      stock: defaultValues?.stock ?? ('' as unknown as number),
    },
  });

  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = form.handleSubmit(async (values: ProductFormValues) => {
    if (requireImage && !file) {
      form.setError('name', { message: 'Select an image before saving.' });
      return;
    }
    await onSubmit(values, file);
  });

  return (
    <form onSubmit={handleSubmit} className="product-form product-form--modal">
      <div className="product-form__field product-form__field--full">
        <label>Name</label>
        <input {...form.register('name')} />
        {form.formState.errors.name && (
          <small style={{ color: 'var(--color-danger)' }}>{form.formState.errors.name.message}</small>
        )}
      </div>

      <div className="product-form__field product-form__field--sku">
        <label>SKU</label>
        <input
          {...form.register('sku')}
          readOnly={lockSku}
          style={{
            width: '100%',
            ...(lockSku ? { background: 'var(--color-surface-muted)', cursor: 'not-allowed' } : {}),
          }}
        />
        {form.formState.errors.sku && (
          <small style={{ color: 'var(--color-danger)' }}>{form.formState.errors.sku.message}</small>
        )}
        {skuNote && !form.formState.errors.sku && (
          <small style={{ color: 'var(--color-text-muted)' }}>{skuNote}</small>
        )}
      </div>

      <div className="product-form__field product-form__field--short">
        <label>Price</label>
        <input
          {...form.register('price')}
          inputMode="decimal"
          onInput={(e) => {
            const t = e.currentTarget;
            // allow only digits, dot, comma; convert comma to dot
            t.value = t.value.replace(/[^0-9.,]/g, '').replace(',', '.');
          }}
          placeholder="e.g. 19.90"
        />
        {form.formState.errors.price && (
          <small style={{ color: 'var(--color-danger)' }}>{form.formState.errors.price.message}</small>
        )}
      </div>

      <div className="product-form__field product-form__field--short">
        <label>Stock</label>
        <input
          {...form.register('stock')}
          inputMode="numeric"
          placeholder="e.g. 10"
        />
        {form.formState.errors.stock && (
          <small style={{ color: 'var(--color-danger)' }}>{form.formState.errors.stock.message}</small>
        )}
      </div>

      {requireImage && (
        <div className="product-form__field product-form__field--full">
          <label>Image (required)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>
      )}

      <div className="product-form__actions">
        {onCancel && (
          <button type="button" onClick={onCancel} className="secondary-button">
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading || form.formState.isSubmitting}
          className="primary-button"
          style={{ opacity: loading || form.formState.isSubmitting ? 0.7 : 1 }}
        >
          {loading || form.formState.isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
