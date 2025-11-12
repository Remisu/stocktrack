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
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-sidebar__brand">
          <div style={{ fontWeight: 700, fontSize: 18 }}>StockTrack</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Inventory Manager</div>
        </div>

        <nav className="app-sidebar__nav">
          {menuItems.map((item) => {
            const active = item.key === activeKey;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onSelect(item.key)}
                aria-current={active ? 'page' : undefined}
                className={active ? 'is-active' : undefined}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="app-sidebar__footer">
          <button
            className="danger-button"
            onClick={onLogout}
            style={{ width: '100%' }}
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="app-main">
        <div className="app-main__inner">
          {children}
        </div>
      </main>
    </div>
  );
}
