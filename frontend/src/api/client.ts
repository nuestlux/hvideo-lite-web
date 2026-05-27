import axios from 'axios';
import { getMockResponse } from './mock';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
});

client.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const mock = getMockResponse(config.url || '', config.method?.toUpperCase() || 'GET', config.data);
  if (mock) {
    config.adapter = async () => ({
      data: mock,
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      config,
    });
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = import.meta.env.BASE_URL + 'login';
    }
    return Promise.reject(error);
  }
);

export default client;
