import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../lib/api';
import AppLayout from '../layouts/AppLayout';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

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

  // Modals
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState<null | Product>(null);

  // Form criação (modal)
  const createForm = useForm<FormData>({ resolver: zodResolver(schema) });
  const [createImage, setCreateImage] = useState<File | null>(null);

  // Form edição (modal)
  const editForm = useForm<FormData>({ resolver: zodResolver(schema) });
  const [editImage, setEditImage] = useState<File | null>(null);

  const load = async () => {
    try {
      const { data } = await api.get<Product[]>('/api/products');
      setProducts(data);
    } catch (e) {
      console.error(e);
      toast.error('Falha ao carregar produtos.');
    }
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

  // Upload imagem (com toasts)
  const onUpload = async (id: number, file: File | null) => {
    if (!file) return;
    const t = toast.loading('Enviando imagem...');
    try {
      const form = new FormData();
      form.append('file', file);
      await api.post(`/api/products/${id}/image`, form);
      await load();
      toast.success('Imagem enviada!', { id: t });
    } catch (e) {
      console.error(e);
      toast.error('Falha no upload (login/tamanho/tipo?)', { id: t });
    }
  };

  const closeEditModal = () => {
    setOpenEdit(null);
    setEditImage(null);
  };

  // Criar (modal)
  const submitCreate = async (data: FormData) => {
    try {
      if (!createImage) {
        toast.error('Selecione uma imagem para criar o produto.');
        return;
      }
      const creating = toast.loading('Criando produto...');
      const res = await api.post<Product>('/api/products', data);
      toast.success('Produto criado!', { id: creating });

      // upload em seguida
      await onUpload(res.data.id, createImage);

      setOpenCreate(false);
      createForm.reset();
      setCreateImage(null);
    } catch (e) {
      console.error(e);
      toast.error('Falha ao salvar produto (verifique se está logado).');
    }
  };

  // Abrir modal de edição
  const openEditModal = (p: Product) => {
    setOpenEdit(p);
    setEditImage(null);
    editForm.reset({
      name: p.name,
      sku: p.sku,
      price: Number(p.price),
      stock: p.stock
    });
  };

  // Editar (modal)
  const submitEdit = async (data: FormData) => {
    try {
      if (!openEdit) return;
      const productId = openEdit.id;
      const t = toast.loading('Salvando alterações...');
      await api.put(`/api/products/${productId}`, data);
      if (editImage) {
        await onUpload(productId, editImage);
        setEditImage(null);
      } else {
        await load();
      }
      toast.success('Produto atualizado!', { id: t });
      closeEditModal();
    } catch (e) {
      console.error(e);
      toast.error('Falha ao editar produto.');
    }
  };

  // Deletar
  const onDelete = async (id: number) => {
    if (!confirm('Apagar este produto?')) return;
    const t = toast.loading('Excluindo...');
    try {
      await api.delete(`/api/products/${id}`);
      await load();
      toast.success('Produto excluído!', { id: t });
    } catch (e) {
      console.error(e);
      toast.error('Falha ao excluir produto.', { id: t });
    }
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
            <div style={{ display:'grid', gap:8, gridTemplateColumns:'80px 1fr 1fr 1fr 1fr auto', alignItems:'center' }}>
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
        onClose={closeEditModal}
        title={`Editar produto${openEdit ? ` #${openEdit.id}` : ''}`}
        footer={
          <>
            <button onClick={closeEditModal} style={{ padding:'8px 12px', borderRadius:8 }}>
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
          <div>
            <label>Imagem (opcional)</label>
            <input type="file" accept="image/*" onChange={(e) => setEditImage(e.target.files?.[0] || null)} />
            {editImage && (
              <small style={{ display:'block', marginTop:6 }}>
                Nova imagem selecionada: {editImage.name}
              </small>
            )}
            {!editImage && openEdit?.imageUrl && (
              <div style={{ marginTop: 8 }}>
                <img
                  src={openEdit.imageUrl}
                  alt={openEdit.name}
                  style={{ width: 72, height: 72, objectFit:'cover', borderRadius:8, border:'1px solid #ccc' }}
                />
              </div>
            )}
            <small style={{ display:'block', marginTop:6, color:'#555' }}>
              A imagem atual será mantida caso nenhuma nova seja enviada.
            </small>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
