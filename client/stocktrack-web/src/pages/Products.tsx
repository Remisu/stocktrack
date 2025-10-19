import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../lib/api';
import AppLayout from '../layouts/AppLayout';
import Modal from '../components/Modal';

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
  imageUrl?: string | null;
};

export default function Products({ onLogout }: { onLogout: () => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [uploadingId, setUploadingId] = useState<number | null>(null);

  // Modals
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState<null | Product>(null);

  // Form criação (modal)
  const createForm = useForm<FormData>({ resolver: zodResolver(schema) });
  const [createImage, setCreateImage] = useState<File | null>(null);

  // Form edição (modal) — usaremos valores padrão quando abrir
  const editForm = useForm<FormData>({ resolver: zodResolver(schema) });

  const load = async () => {
    const { data } = await api.get<Product[]>('/api/products');
    setProducts(data);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q)
    );
  }, [products, query]);

  // Upload imagem (reutilizável)
  const onUpload = async (id: number, file: File | null) => {
    if (!file) return;
    try {
      setUploadingId(id);
      const form = new FormData();
      form.append('file', file);
      await api.post(`/api/products/${id}/image`, form);
      await load();
    } catch (e) {
      console.error(e);
      alert('Falha no upload da imagem (verifique login e tamanho/formatos).');
    } finally {
      setUploadingId(null);
    }
  };

  // A) Criar (modal)
  const submitCreate = async (data: FormData) => {
    try {
      if (!createImage) {
        alert('Selecione uma imagem para criar o produto.');
        return;
      }
      const res = await api.post<Product>('/api/products', data);
      await onUpload(res.data.id, createImage);
      setOpenCreate(false);
      createForm.reset();
      setCreateImage(null);
    } catch (e) {
      console.error(e);
      alert('Falha ao salvar produto (verifique se está logado).');
    }
  };

  // B) Editar (modal)
  const openEditModal = (p: Product) => {
    setOpenEdit(p);
    editForm.reset({
      name: p.name,
      sku: p.sku,
      price: Number(p.price),
      stock: p.stock
    });
  };

  const submitEdit = async (data: FormData) => {
    try {
      if (!openEdit) return;
      await api.put(`/api/products/${openEdit.id}`, data);
      setOpenEdit(null);
      await load();
    } catch (e) {
      console.error(e);
      alert('Falha ao editar produto.');
    }
  };

  const onDelete = async (id: number) => {
    if (!confirm('Apagar este produto?')) return;
    await api.delete(`/api/products/${id}`);
    load();
  };

  return (
    <AppLayout onLogout={onLogout}>
      {/* Header com busca */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 14 }}>
        <h2 style={{ margin: 0 }}>Produtos</h2>
        <button
          onClick={() => setOpenCreate(true)}
          style={{ background:'#2563eb', color:'#fff', border:'none', padding:'8px 12px', borderRadius:8, fontWeight:600 }}
        >
          Cadastrar
        </button>
      </div>

      <div style={{ display:'flex', gap:8, marginBottom: 16, maxWidth: 600 }}>
        <input
          placeholder="Buscar por nome ou SKU..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: 1 }}
        />
        <button onClick={() => setQuery('')} disabled={!query.trim()}>
          Limpar
        </button>
      </div>

      {/* Lista */}
      <ul style={{ display:'grid', gap:8, paddingLeft:0, listStyle:'none' }}>
        {filtered.map(p => (
          <li key={p.id} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:12 }}>
            <div style={{ display:'grid', gap:8, gridTemplateColumns:'80px 1fr 1fr 1fr 1fr auto auto', alignItems:'center' }}>
              <div>
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    style={{ width: 72, height: 72, objectFit:'cover', borderRadius:8, border:'1px solid #ccc' }}
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
                <button
                  onClick={() => openEditModal(p)}
                  style={{ background:'#0ea5e9', color:'#fff', border:'none', padding:'6px 10px', borderRadius:6 }}
                >
                  Editar
                </button>
                <button
                  onClick={() => onDelete(p.id)}
                  title="Excluir"
                  style={{ background:'transparent', border:'none', cursor:'pointer', fontSize:18 }}
                >
                  🗑️
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Modal: Cadastrar */}
      <Modal
        open={openCreate}
        onClose={() => { setOpenCreate(false); }}
        title="Cadastrar produto"
        footer={
          <>
            <button onClick={() => setOpenCreate(false)} style={{ padding:'8px 12px', borderRadius:8 }}>
              Cancelar
            </button>
            <button
              onClick={createForm.handleSubmit(submitCreate)}
              style={{ background:'#2563eb', color:'#fff', border:'none', padding:'8px 12px', borderRadius:8 }}
              disabled={createForm.formState.isSubmitting}
            >
              {createForm.formState.isSubmitting ? 'Salvando...' : 'Cadastrar'}
            </button>
          </>
        }
      >
        <form onSubmit={createForm.handleSubmit(submitCreate)} style={{ display:'grid', gap:10 }}>
          <div>
            <label>Nome</label>
            <input {...createForm.register('name')} />
            {createForm.formState.errors.name && <small style={{ color:'crimson' }}>{createForm.formState.errors.name.message}</small>}
          </div>
          <div>
            <label>SKU</label>
            <input {...createForm.register('sku')} />
            {createForm.formState.errors.sku && <small style={{ color:'crimson' }}>{createForm.formState.errors.sku.message}</small>}
          </div>
          <div>
            <label>Preço</label>
            <input
              {...createForm.register('price')}
              inputMode="decimal"
              onInput={(e) => {
                const t = e.currentTarget;
                t.value = t.value.replace(/[^0-9.,]/g, '').replace(',', '.');
              }}
              placeholder="ex: 19.90"
            />
            {createForm.formState.errors.price && <small style={{ color:'crimson' }}>{createForm.formState.errors.price.message}</small>}
          </div>
          <div>
            <label>Estoque</label>
            <input {...createForm.register('stock')} inputMode="numeric" placeholder="ex: 10" />
            {createForm.formState.errors.stock && <small style={{ color:'crimson' }}>{createForm.formState.errors.stock.message}</small>}
          </div>
          <div>
            <label>Imagem (obrigatória)</label>
            <input type="file" accept="image/*" onChange={(e) => setCreateImage(e.target.files?.[0] || null)} />
          </div>
        </form>
      </Modal>

      {/* Modal: Editar */}
      <Modal
        open={!!openEdit}
        onClose={() => setOpenEdit(null)}
        title={`Editar produto${openEdit ? ` #${openEdit.id}` : ''}`}
        footer={
          <>
            <button onClick={() => setOpenEdit(null)} style={{ padding:'8px 12px', borderRadius:8 }}>
              Cancelar
            </button>
            <button
              onClick={editForm.handleSubmit(submitEdit)}
              style={{ background:'#16a34a', color:'#fff', border:'none', padding:'8px 12px', borderRadius:8 }}
              disabled={editForm.formState.isSubmitting}
            >
              {editForm.formState.isSubmitting ? 'Salvando...' : 'Salvar'}
            </button>
          </>
        }
      >
        <form onSubmit={editForm.handleSubmit(submitEdit)} style={{ display:'grid', gap:10 }}>
          <div>
            <label>Nome</label>
            <input {...editForm.register('name')} />
            {editForm.formState.errors.name && <small style={{ color:'crimson' }}>{editForm.formState.errors.name.message}</small>}
          </div>
          <div>
            <label>SKU</label>
            <input {...editForm.register('sku')} />
            {editForm.formState.errors.sku && <small style={{ color:'crimson' }}>{editForm.formState.errors.sku.message}</small>}
          </div>
          <div>
            <label>Preço</label>
            <input
              {...editForm.register('price')}
              inputMode="decimal"
              onInput={(e) => {
                const t = e.currentTarget;
                t.value = t.value.replace(/[^0-9.,]/g, '').replace(',', '.');
              }}
            />
            {editForm.formState.errors.price && <small style={{ color:'crimson' }}>{editForm.formState.errors.price.message}</small>}
          </div>
          <div>
            <label>Estoque</label>
            <input {...editForm.register('stock')} inputMode="numeric" />
            {editForm.formState.errors.stock && <small style={{ color:'crimson' }}>{editForm.formState.errors.stock.message}</small>}
          </div>
          <div style={{ fontSize: 12, color:'#555' }}>
            A imagem pode ser alterada pela lista (input de arquivo).
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}