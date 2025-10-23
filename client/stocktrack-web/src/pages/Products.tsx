import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import AppLayout from '../layouts/AppLayout';
import Modal from '../components/Modal';
import ProductForm, { type ProductFormValues } from '../components/ProductForm';
import ProductItem, { type Product } from '../components/ProductItem';

export default function Products({ onLogout }: { onLogout: () => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState<null | Product>(null);

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

  const handleUpload = async (id: number, file: File) => {
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

  const handleCreate = async (values: ProductFormValues, file?: File | null) => {
    try {
      if (!file) {
        toast.error('Selecione uma imagem para criar o produto.');
        return;
      }
      const creating = toast.loading('Criando produto...');
      const res = await api.post<Product>('/api/products', values);
      await handleUpload(res.data.id, file);
      toast.success('Produto criado!', { id: creating });
      setOpenCreate(false);
      await load();
    } catch (e) {
      console.error(e);
      toast.error('Falha ao criar produto.');
    }
  };

  const handleEdit = async (values: ProductFormValues) => {
    if (!openEdit) return;
    const t = toast.loading('Salvando alterações...');
    try {
      await api.put(`/api/products/${openEdit.id}`, values);
      toast.success('Produto atualizado!', { id: t });
      setOpenEdit(null);
      await load();
    } catch (e) {
      console.error(e);
      toast.error('Falha ao editar produto.', { id: t });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apagar este produto?')) return;
    const t = toast.loading('Excluindo...');
    try {
      await api.delete(`/api/products/${id}`);
      toast.success('Produto excluído!', { id: t });
      await load();
    } catch (e) {
      console.error(e);
      toast.error('Falha ao excluir produto.', { id: t });
    }
  };

  return (
    <AppLayout onLogout={onLogout}>
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

      <ul style={{ display:'grid', gap:8, paddingLeft:0, listStyle:'none' }}>
        {filtered.map(p => (
          <ProductItem
            key={p.id}
            product={p}
            onEdit={setOpenEdit}
            onDelete={handleDelete}
          />
        ))}
      </ul>

      {/* Modal: Cadastrar */}
      <Modal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        title="Cadastrar produto"
      >
        <ProductForm
          submitLabel="Cadastrar"
          requireImage
          onSubmit={handleCreate}
          onCancel={() => setOpenCreate(false)}
        />
      </Modal>

      {/* Modal: Editar (+ upload de imagem dentro do modal) */}
      <Modal
        open={!!openEdit}
        onClose={() => setOpenEdit(null)}
        title={`Editar produto${openEdit ? ` #${openEdit.id}` : ''}`}
      >
        {openEdit && (
          <>
            <ProductForm
              submitLabel="Salvar"
              defaultValues={{
                name: openEdit.name,
                sku: openEdit.sku,
                price: Number(openEdit.price as any),
                stock: openEdit.stock,
              }}
              onSubmit={handleEdit}
              onCancel={() => setOpenEdit(null)}
            />

            <div style={{ marginTop: 16 }}>
              <label>Alterar imagem:</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && openEdit) handleUpload(openEdit.id, file);
                }}
              />
            </div>
          </>
        )}
      </Modal>
    </AppLayout>
  );
}
