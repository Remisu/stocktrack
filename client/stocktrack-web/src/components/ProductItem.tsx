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

export default function ProductItem({ product: p, onEdit, onDelete }: Props) {
  return (
    <li className="product-item">
      <div className="product-item__grid">
        <div className="product-item__media">
          {p.imageUrl ? (
            <img src={p.imageUrl} alt={p.name} />
          ) : (
            <div className="product-item__placeholder">no image</div>
          )}
        </div>
        <div className="product-item__name">
          <strong>{p.name}</strong>
        </div>
        <div className="product-item__sku">{p.sku}</div>
        <div className="product-item__price">¥{p.price}</div>
        <div className="product-item__stock">Stock: {p.stock}</div>
        <div className="product-item__actions">
          <button className="primary-button" onClick={() => onEdit(p)}>
            Edit
          </button>
          <button className="icon-button" onClick={() => onDelete(p.id)} title="Delete">
            🗑️
          </button>
        </div>
      </div>
    </li>
  );
}
