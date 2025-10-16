import axios from 'axios';
import { getToken } from './auth';
import { clearToken } from './auth';

export const api = axios.create({});

// Anexa o Bearer token (se existir)
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      clearToken();
      // força voltar para tela Auth
      window.location.reload();
    }
    return Promise.reject(err);
  }
);