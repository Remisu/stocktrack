import { ReactNode } from 'react';

type NavItem = {
  key: string;
  label: string;
};

type AppLayoutProps = {
  children: ReactNode;
  onLogout: () => void;
  menuItems: ReadonlyArray<NavItem>;
  activeKey: string;
  onSelect: (key: string) => void;
};

export default function AppLayout({
  children,
  onLogout,
  menuItems,
  activeKey,
  onSelect,
}: AppLayoutProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '240px 1fr',
        height: '100vh',
        minHeight: 0,
        overflow: 'hidden',
        fontFamily: 'system-ui',
      }}
    >
      <aside
        style={{
          background: '#0f172a',
          color: '#e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        <div style={{ padding: 16, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontWeight: 700, fontSize: 18 }}>StockTrack</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Inventory Manager</div>
        </div>

        <nav style={{ padding: 12, display: 'grid', gap: 6 }}>
          {menuItems.map((item) => {
            const active = item.key === activeKey;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onSelect(item.key)}
                aria-current={active ? 'page' : undefined}
                style={{
                  textAlign: 'left',
                  border: 'none',
                  background: active ? 'rgba(255,255,255,0.18)' : 'transparent',
                  color: '#e2e8f0',
                  padding: '8px 10px',
                  borderRadius: 8,
                  fontWeight: active ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div style={{ marginTop: 'auto', padding: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={onLogout}
            style={{
              width: '100%',
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              padding: '10px 12px',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      <main
        style={{
          padding: '28px 24px',
          color: '#0f172a',
          overflowY: 'auto',
          minHeight: 0,
        }}
      >
        <div style={{ maxWidth: 1024, margin: '0 auto', paddingBottom: 40 }}>
          {children}
        </div>
      </main>
    </div>
  );
}
