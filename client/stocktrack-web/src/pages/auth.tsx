import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../lib/api';
import { setToken } from '../lib/auth';

const registerSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});
type RegisterForm = z.infer<typeof registerSchema>;

const loginSchema = registerSchema;
type LoginForm = RegisterForm;

export default function Auth({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('register');

  const regForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });
  const logForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const handleRegister = async (data: RegisterForm) => {
    await api.post('/api/auth/register', data);
    // após registrar, já faz login
    const res = await api.post('/api/auth/login', data);
    setToken(res.data.token);
    onDone();
  };

  const handleLogin = async (data: LoginForm) => {
    const res = await api.post('/api/auth/login', data);
    setToken(res.data.token);
    onDone();
  };

  return (
    <div style={{ maxWidth: 420, margin: '4rem auto', fontFamily: 'system-ui' }}>
      <h1>StockTrack — {mode === 'register' ? 'Registrar' : 'Login'}</h1>

      <div style={{ display: 'flex', gap: 8, margin: '1rem 0' }}>
        <button onClick={() => setMode('register')} disabled={mode==='register'}>Registrar</button>
        <button onClick={() => setMode('login')} disabled={mode==='login'}>Login</button>
      </div>

      {mode === 'register' ? (
        <form onSubmit={regForm.handleSubmit(handleRegister)} style={{ display:'grid', gap:8 }}>
          <input placeholder="E-mail" {...regForm.register('email')} />
          {regForm.formState.errors.email && <small style={{color:'crimson'}}>{regForm.formState.errors.email.message}</small>}
          <input type="password" placeholder="Senha" {...regForm.register('password')} />
          {regForm.formState.errors.password && <small style={{color:'crimson'}}>{regForm.formState.errors.password.message}</small>}
          <button type="submit" disabled={regForm.formState.isSubmitting}>
            {regForm.formState.isSubmitting ? 'Enviando...' : 'Criar conta'}
          </button>
        </form>
      ) : (
        <form onSubmit={logForm.handleSubmit(handleLogin)} style={{ display:'grid', gap:8 }}>
          <input placeholder="E-mail" {...logForm.register('email')} />
          {logForm.formState.errors.email && <small style={{color:'crimson'}}>{logForm.formState.errors.email.message}</small>}
          <input type="password" placeholder="Senha" {...logForm.register('password')} />
          {logForm.formState.errors.password && <small style={{color:'crimson'}}>{logForm.formState.errors.password.message}</small>}
          <button type="submit" disabled={logForm.formState.isSubmitting}>
            {logForm.formState.isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      )}
    </div>
  );
}