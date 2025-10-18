import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../lib/api';

const schema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  sku: z.string().min(1, 'SKU obrigatório'),
  price: z.coerce.number().positive('Preço deve ser > 0'),
  stock: z.coerce.number().int('Número inteiro').nonnegative('>= 0'),
});
type FormData = z.infer<typeof schema>;

type Product = {
  id: number;
  name: string;
  sku: string;
  price: string; // Prisma Decimal -> string
  stock: number;
  imageUrl?: string | null; // 👈 importante para mostrar thumbnail
};

export default function Products({ onLogout }: { onLogout: () => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<{ name: string; sku: string; price: string; stock: number } | null>(null);

  // novo: imagem que será anexada junto com a criação
  const [newImage, setNewImage] = useState<File | null>(null);

  // novo: id do item que está enviando imagem (pra mostrar "Enviando...")
  const [uploadingId, setUploadingId] = useState<number | null>(null);

  const { register, handleSubmit, reset, formState:{errors, isSubmitting} } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  const load = async () => {
    try {
      const { data } = await api.get<Product[]>('/api/products');
      setProducts(data);
    } catch (e) {
      console.error(e);
      alert('Falha ao carregar produtos');
    }
  };

  useEffect(() => { load(); }, []);

  const onSubmit = async (data: FormData) => {
    try {
      // 1) cria o produto
      const res = await api.post<Product>('/api/products', data); // exige token
      const created = res.data;

      // 2) se o usuário selecionou imagem na criação, faz upload em seguida
      if (newImage) {
        await onUpload(created.id, newImage, { silentLoad: true });
        setNewImage(null); // limpa o input
      }

      reset();
      await load(); // recarrega para refletir qualquer mudança
    } catch (e) {
      console.error(e);
      alert('Falha ao salvar produto (verifique se está logado).');
    }
  };

  const onDelete = async (id: number) => {
    if (!confirm('Apagar este produto?')) return;
    try {
      await api.delete(`/api/products/${id}`); // exige token
      load();
    } catch (e) {
      console.error(e);
      alert('Falha ao apagar produto (verifique se está logado).');
    }
  };

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setEditDraft({
      name: p.name,
      sku: p.sku,
      price: p.price,
      stock: p.stock
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft(null);
  };

  const saveEdit = async (id: number) => {
    if (!editDraft) return;
    try {
      await api.put(`/api/products/${id}`, {
        ...editDraft,
        price: Number(editDraft.price),
        stock: Number(editDraft.stock),
      });
      setEditingId(null);
      setEditDraft(null);
      load();
    } catch (e) {
      console.error(e);
      alert('Falha ao editar produto (verifique se está logado e dados válidos).');
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q)
    );
  }, [products, query]);

  // 🔼 melhorado: suporta feedback de loading e opção de não recarregar 2x
  const onUpload = async (id: number, file: File | null, opts?: { silentLoad?: boolean }) => {
    if (!file) return;
    try {
      setUploadingId(id);
      const form = new FormData();
      form.append('file', file);

      await api.post(`/api/products/${id}/image`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (!opts?.silentLoad) {
        await load(); // atualiza a lista para mostrar a nova thumbnail
      }
    } catch (e) {
      console.error(e);
      alert('Falha no upload da imagem (verifique se está logado e o tamanho/formatos).');
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto', fontFamily: 'system-ui' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h1>StockTrack — Produtos</h1>
        <button onClick={onLogout}>Sair</button>
      </div>

      {/* filtro simples */}
      <div style={{ display:'flex', gap:8, marginBottom: 12 }}>
        <input
          placeholder="Buscar por nome ou SKU..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: 1 }}
        />
        <button onClick={() => setQuery('')}>Limpar</button>
      </div>

      {/* criar novo (agora com input de imagem) */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{
          display:'grid',
          gap:8,
          gridTemplateColumns:'1fr 1fr 1fr 1fr auto auto',
          alignItems:'start'
        }}
      >
        <div>
          <input placeholder="Nome" {...register('name')} />
          {errors.name && <small style={{color:'crimson'}}>{errors.name.message}</small>}
        </div>
        <div>
          <input placeholder="SKU" {...register('sku')} />
          {errors.sku && <small style={{color:'crimson'}}>{errors.sku.message}</small>}
        </div>
        <div>
          <input placeholder="Preço (ex: 19.90)" {...register('price')} />
          {errors.price && <small style={{color:'crimson'}}>{errors.price.message}</small>}
        </div>
        <div>
          <input placeholder="Estoque (ex: 10)" {...register('stock')} />
          {errors.stock && <small style={{color:'crimson'}}>{errors.stock.message}</small>}
        </div>

        {/* novo: upload junto com criação */}
        <div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setNewImage(e.target.files?.[0] || null)}
          />
        </div>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Adicionar'}
        </button>
      </form>

      <hr style={{ margin: '1.5rem 0' }} />

      <h2>Lista</h2>
      {filtered.length === 0 && <p>Nenhum produto encontrado.</p>}

      <ul style={{ display:'grid', gap:8, paddingLeft:0, listStyle:'none' }}>
        {filtered.map(p => (
          <li key={p.id} style={{ border:'1px solid #ddd', borderRadius:8, padding:12 }}>
            {editingId === p.id ? (
              <div style={{ display:'grid', gap:8, gridTemplateColumns:'1fr 1fr 1fr 1fr auto auto', alignItems:'center' }}>
                <input
                  value={editDraft?.name ?? ''}
                  onChange={(e) => setEditDraft(d => ({ ...(d as any), name: e.target.value }))}
                  placeholder="Nome"
                />
                <input
                  value={editDraft?.sku ?? ''}
                  onChange={(e) => setEditDraft(d => ({ ...(d as any), sku: e.target.value }))}
                  placeholder="SKU"
                />
                <input
                  value={editDraft?.price ?? ''}
                  onChange={(e) => setEditDraft(d => ({ ...(d as any), price: e.target.value }))}
                  placeholder="Preço"
                />
                <input
                  value={editDraft?.stock ?? 0}
                  onChange={(e) => setEditDraft(d => ({ ...(d as any), stock: Number(e.target.value || 0) }))}
                  placeholder="Estoque"
                />
                <button onClick={() => saveEdit(p.id)}>Salvar</button>
                <button onClick={cancelEdit}>Cancelar</button>
              </div>
            ) : (
              // modo visual + upload por item
              <div style={{ display:'grid', gap:8, gridTemplateColumns:'80px 1fr 1fr 1fr 1fr auto auto', alignItems:'center' }}>
                <div>
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid #ccc' }}
                    />
                  ) : (
                    <div style={{ width:72, height:72, border:'1px dashed #ccc', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:'#888', fontSize:12 }}>
                      sem imagem
                    </div>
                  )}
                </div>
                <div><strong>{p.name}</strong></div>
                <div>{p.sku}</div>
                <div>¥{p.price}</div>
                <div>Estoque: {p.stock}</div>

                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => onUpload(p.id, e.target.files?.[0] || null)}
                    disabled={uploadingId === p.id}
                  />
                  {uploadingId === p.id && <small style={{ marginLeft: 8 }}>Enviando...</small>}
                </div>

                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => startEdit(p)}>Editar</button>
                  <button onClick={() => onDelete(p.id)}>Excluir</button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}