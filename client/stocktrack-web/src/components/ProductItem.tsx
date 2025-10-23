import { } from 'react';

export type Product = {
  id: number;
  name: string;
  sku: string;
  price: string; // Prisma Decimal -> string
  stock: number;
  imageUrl?: string | null;
};

type Props = {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void | Promise<void>;
};

export default function ProductItem({
  product: p,
  onEdit,
  onDelete,
}: Props) {

  return (
    <li style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
      <div
        style={{
          display: 'grid',
          gap: 8,
          gridTemplateColumns: '80px 1fr 1fr 1fr 1fr auto',
          alignItems: 'center',
        }}
      >
        <div>
          {p.imageUrl ? (
            <img
              src={p.imageUrl}
              alt={p.name}
              style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid #ccc' }}
            />
          ) : (
            <div
              style={{
                width: 72,
                height: 72,
                border: '1px dashed #ccc',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#888',
                fontSize: 12,
              }}
            >
              sem imagem
            </div>
          )}
        </div>

        <div>
          <strong>{p.name}</strong>
        </div>
        <div>{p.sku}</div>
        <div>¥{p.price}</div>
        <div>Estoque: {p.stock}</div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => onEdit(p)}
            style={{ background: '#0ea5e9', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: 6 }}
          >
            Editar
          </button>
          <button
            onClick={() => onDelete(p.id)}
            title="Excluir"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 18 }}
          >
            🗑️
          </button>
        </div>
      </div>
    </li>
  );
}