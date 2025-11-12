import { useEffect, useState } from 'react';
import Auth from './pages/auth';
import Products from './pages/Products';
import Logs from './pages/Logs';
import AppLayout from './layouts/AppLayout';
import { clearToken, isAuthenticated } from './lib/auth';
import ThemeToggle from './components/ThemeToggle';

export default function App() {
  const [authed, setAuthed] = useState<boolean>(false);
  const [activePage, setActivePage] = useState<'products' | 'logs'>('products');

  useEffect(() => {
    setAuthed(isAuthenticated());
  }, []);

  const handleLogin = () => {
    setAuthed(true);
    setActivePage('products');
  };
  const onLogout = () => {
    clearToken();
    setAuthed(false);
    setActivePage('products');
  };

  const menuItems = [
    { key: 'products', label: 'Products' },
    { key: 'logs', label: 'Logs' },
  ] as const;

  const handleSelect = (key: string) => {
    if (key === 'logs' || key === 'products') {
      setActivePage(key);
    }
  };

  let content: JSX.Element | null = null;
  switch (activePage) {
    case 'logs':
      content = <Logs />;
      break;
    case 'products':
    default:
      content = <Products />;
  }

  return (
    <>
      <ThemeToggle variant="floating" />
      {authed ? (
        <AppLayout
          onLogout={onLogout}
          menuItems={menuItems}
          activeKey={activePage}
          onSelect={handleSelect}
        >
          {content}
        </AppLayout>
      ) : (
        <Auth onLogin={handleLogin} />
      )}
    </>
  );
}
