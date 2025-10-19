import { ReactNode } from 'react';

type AppLayoutProps = {
  children: ReactNode;
  onLogout: () => void;
};

export default function AppLayout({ children, onLogout }: AppLayoutProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: '100vh', fontFamily: 'system-ui' }}>
      {/* Sidebar */}
      <aside style={{ background: '#0f172a', color: '#e2e8f0', display:'flex', flexDirection:'column' }}>
        <div style={{ padding: 16, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontWeight: 700, fontSize: 18 }}>StockTrack</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Inventory Manager</div>
        </div>

        <nav style={{ padding: 12, display:'grid', gap: 6 }}>
          <a
            href="#"
            style={{
              textDecoration:'none', color:'#e2e8f0', padding:'8px 10px', borderRadius:8,
              background:'rgba(255,255,255,0.06)'
            }}
          >
            Produtos
          </a>
          {/* Coloque outros itens de menu aqui no futuro */}
        </nav>

        <div style={{ marginTop: 'auto', padding: 12, borderTop:'1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={onLogout}
            style={{
              width:'100%', background:'#ef4444', color:'#fff', border:'none',
              padding:'10px 12px', borderRadius:8, cursor:'pointer', fontWeight:600
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Content */}
      <main style={{ padding: '28px 24px', color: '#0f172a' }}>
        <div style={{ maxWidth: 1024, margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
