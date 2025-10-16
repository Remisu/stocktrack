import { useEffect, useState } from 'react';
import Auth from './pages/Auth';
import Products from './pages/Products';
import { clearToken, isAuthenticated } from './lib/auth';

export default function App() {
  const [authed, setAuthed] = useState<boolean>(false);

  useEffect(() => {
    setAuthed(isAuthenticated());
  }, []);

  const onDoneAuth = () => setAuthed(true);
  const onLogout = () => {
    clearToken();
    setAuthed(false);
  };

  return authed ? (
    <Products onLogout={onLogout} />
  ) : (
    <Auth onDone={onDoneAuth} />
  );
}