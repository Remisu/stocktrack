import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import Modal from '../components/Modal';
import ProductForm, { type ProductFormValues } from '../components/ProductForm';
import ProductItem, { type Product } from '../components/ProductItem';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState<null | Product>(null);
  const [editImage, setEditImage] = useState<File | null>(null);
  const [generatedSku, setGeneratedSku] = useState('');

  const createSku = () => {
    const time = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `SKU-${time}-${random}`;
  };

  const handleOpenCreate = () => {
    setGeneratedSku(createSku());
    setOpenCreate(true);
  };

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
      const payload = {
        ...values,
        sku: values.sku?.trim() || generatedSku || createSku(),
      };
      const res = await api.post<Product>('/api/products', payload);
      await handleUpload(res.data.id, file);
      toast.success('Produto criado!', { id: creating });
      setOpenCreate(false);
      setGeneratedSku('');
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
      if (editImage) {
        const form = new FormData();
        form.append('file', editImage);
        await api.post(`/api/products/${openEdit.id}/image`, form);
      }
      toast.success('Produto atualizado!', { id: t });
      setOpenEdit(null);
      setEditImage(null);
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
    <>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 14 }}>
        <h2 style={{ margin: 0 }}>Produtos</h2>
        <button
          onClick={handleOpenCreate}
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
        onClose={() => {
          setOpenCreate(false);
          setGeneratedSku('');
        }}
        title="Cadastrar produto"
      >
        <ProductForm
          submitLabel="Cadastrar"
          requireImage
          lockSku
          skuNote="SKU gerado automaticamente."
          defaultValues={{ sku: generatedSku }}
          onSubmit={handleCreate}
          onCancel={() => {
            setOpenCreate(false);
            setGeneratedSku('');
          }}
        />
      </Modal>

      {/* Modal: Editar (+ upload de imagem dentro do modal) */}
      <Modal
        open={!!openEdit}
        onClose={() => {
          setOpenEdit(null);
          setEditImage(null);
        }}
        title={`Editar produto${openEdit ? ` #${openEdit.id}` : ''}`}
      >
        {openEdit && (
          <>
            <ProductForm
              submitLabel="Salvar"
              defaultValues={{
                name: openEdit.name,
                sku: openEdit.sku,
                price: Number(openEdit.price),
                stock: openEdit.stock,
              }}
              onSubmit={handleEdit}
              onCancel={() => { setOpenEdit(null); setEditImage(null); }}
            />

            <div style={{ marginTop: 16 }}>
              <label>Alterar imagem:</label>
              <div style={{ display:'flex', gap:12, alignItems:'center', marginTop:8 }}>
                <div>
                  {/* Preview da nova imagem OU imagem atual */}
                  {editImage ? (
                    <img
                      src={URL.createObjectURL(editImage)}
                      alt="preview"
                      style={{ width:72, height:72, objectFit:'cover', borderRadius:8, border:'1px solid #ccc' }}
                    />
                  ) : openEdit.imageUrl ? (
                    <img
                      src={openEdit.imageUrl}
                      alt={openEdit.name}
                      style={{ width:72, height:72, objectFit:'cover', borderRadius:8, border:'1px solid #ccc' }}
                    />
                  ) : (
                    <div style={{ width:72, height:72, border:'1px dashed #ccc', borderRadius:8,
                      display:'flex', alignItems:'center', justifyContent:'center', color:'#888', fontSize:12 }}>
                      sem imagem
                    </div>
                  )}
                </div>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditImage(e.target.files?.[0] || null)}
                />
              </div>
              <small style={{ color:'#555' }}>A imagem será enviada ao clicar em <strong>Salvar</strong>.</small>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
