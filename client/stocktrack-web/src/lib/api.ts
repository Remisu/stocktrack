import axios from 'axios';

export const api = axios.create({
  // Não precisa definir baseURL, o proxy do Vite cuida do /api → localhost:3001
});