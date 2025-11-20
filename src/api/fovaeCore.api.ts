import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL;

export const fovaeCoreApi = axios.create({
    baseURL: `${ BASE_URL }`
});

// 🔑 Interceptor que siempre lee el token actualizado
fovaeCoreApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  } else if (config.headers?.Authorization) {
    delete config.headers.Authorization;
  }

  return config;
});