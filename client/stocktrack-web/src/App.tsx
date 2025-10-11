import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from './lib/api';
import { productSchema, type ProductForm, type Product } from './types/product';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const { register, handleSubmit, reset, formState:{errors, isSubmitting} } =
    useForm<ProductForm>({ resolver: zodResolver(productSchema) });

  const load = async () => {
    const { data } = await api.get<Product[]>('/api/products');
    setProducts(data);
  };

  useEffect(() => { load(); }, []);

  const onSubmit = async (form: ProductForm) => {
    await api.post('/api/products', form); // envia { name, sku, price, stock }
    reset();
    load();
  };

  return (
    <div style={{ maxWidth: 720, margin: '2rem auto', fontFamily: 'system-ui' }}>
      <h1>StockTrack</h1>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display:'grid', gap:8 }}>
        <input placeholder="Nome" {...register('name')} />
        {errors.name && <small style={{color:'crimson'}}>{errors.name.message}</small>}

        <input placeholder="SKU" {...register('sku')} />
        {errors.sku && <small style={{color:'crimson'}}>{errors.sku.message}</small>}

        <input placeholder="Preço (ex: 19.90)" {...register('price')} />
        {errors.price && <small style={{color:'crimson'}}>{errors.price.message}</small>}

        <input placeholder="Estoque (ex: 10)" {...register('stock')} />
        {errors.stock && <small style={{color:'crimson'}}>{errors.stock.message}</small>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Adicionar produto'}
        </button>
      </form>

      <hr style={{ margin: '1.5rem 0' }} />

      <h2>Produtos</h2>
      {products.length === 0 && <p>Nenhum produto ainda.</p>}
      <ul>
        {products.map(p => (
          <li key={p.id}>
            <strong>{p.name}</strong> — {p.sku} — ¥{p.price} — estoque: {p.stock}
          </li>
        ))}
      </ul>
    </div>
  );
}