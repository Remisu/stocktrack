import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  sku: z.string().min(1, 'SKU obrigatório'),
  price: z.coerce.number().positive('Preço deve ser > 0'),
  stock: z.coerce.number().int('Número inteiro').nonnegative('>= 0'),
});
export type ProductFormValues = z.infer<typeof schema>;

type Props = {
  defaultValues?: Partial<ProductFormValues>;
  submitLabel: string;
  onSubmit: (values: ProductFormValues, file?: File | null) => Promise<void> | void;
  onCancel?: () => void;
  loading?: boolean;
  /** Mostra input de imagem e exige arquivo (para criar) */
  requireImage?: boolean;
};

export default function ProductForm({
  defaultValues,
  submitLabel,
  onSubmit,
  onCancel,
  loading,
  requireImage,
}: Props) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      sku: defaultValues?.sku ?? '',
      price: defaultValues?.price ?? ('' as unknown as number),
      stock: defaultValues?.stock ?? ('' as unknown as number),
    },
  });

  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = form.handleSubmit(async (values) => {
    if (requireImage && !file) {
      form.setError('name', { message: 'Selecione uma imagem antes de salvar.' });
      return;
    }
    await onSubmit(values, file);
  });

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 10 }}>
      <div>
        <label>Nome</label>
        <input {...form.register('name')} />
        {form.formState.errors.name && (
          <small style={{ color: 'crimson' }}>{form.formState.errors.name.message}</small>
        )}
      </div>

      <div>
        <label>SKU</label>
        <input {...form.register('sku')} />
        {form.formState.errors.sku && (
          <small style={{ color: 'crimson' }}>{form.formState.errors.sku.message}</small>
        )}
      </div>

      <div>
        <label>Preço</label>
        <input
          {...form.register('price')}
          inputMode="decimal"
          onInput={(e) => {
            const t = e.currentTarget;
            // só números, ponto e vírgula; vírgula vira ponto
            t.value = t.value.replace(/[^0-9.,]/g, '').replace(',', '.');
          }}
          placeholder="ex: 19.90"
        />
        {form.formState.errors.price && (
          <small style={{ color: 'crimson' }}>{form.formState.errors.price.message}</small>
        )}
      </div>

      <div>
        <label>Estoque</label>
        <input
          {...form.register('stock')}
          inputMode="numeric"
          placeholder="ex: 10"
        />
        {form.formState.errors.stock && (
          <small style={{ color: 'crimson' }}>{form.formState.errors.stock.message}</small>
        )}
      </div>

      {requireImage && (
        <div>
          <label>Imagem (obrigatória)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
        {onCancel && (
          <button type="button" onClick={onCancel} style={{ padding: '8px 12px', borderRadius: 8 }}>
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={loading || form.formState.isSubmitting}
          style={{
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            padding: '8px 12px',
            borderRadius: 8,
            opacity: loading || form.formState.isSubmitting ? 0.7 : 1,
          }}
        >
          {loading || form.formState.isSubmitting ? 'Salvando...' : submitLabel}
        </button>
      </div>
    </form>
  );
}