import client from './client';

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    status: string;
    points: number;
  };
}

export const authApi = {
  login: (email: string, password: string) =>
    client.post<{ data: LoginResponse }>('/auth/login', { email, password }),

  verifyOtp: (email: string, otp: string, purpose?: string) =>
    client.post<{ data: { setup_token: string } }>('/auth/verify-otp', { email, otp, ...(purpose ? { purpose } : {}) }),

  setPassword: (setupToken: string, password: string) =>
    client.post<{ data: LoginResponse }>('/auth/set-password', { setup_token: setupToken, password }),

  forgotPassword: (email: string) =>
    client.post<{ data: {}; message: string }>('/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) =>
    client.post<{ data: {}; message: string }>('/auth/reset-password', { token, new_password: newPassword }),

  logout: () => client.post('/auth/logout'),
};
