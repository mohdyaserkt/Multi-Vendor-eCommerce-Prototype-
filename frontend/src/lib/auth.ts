'use client';
import api from './api';

export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'SELLER' | 'CUSTOMER';
  requires2FA: boolean;
}

export interface LoginResponse {
  requires2FA?: any;
  success: boolean;
  data?: {
    accessToken?: string;
    user?: User;
    authChallengeId?: string;
    requires2FA?: boolean;
    testOtp?:string;
  };
  message?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  role: 'ADMIN' | 'SELLER' | 'CUSTOMER';
  profile: {
    firstName: string;
    lastName: string;
    phone?: string;
  };
}

export interface RegisterResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

// Login function
export async function login(email: string, password: string): Promise<LoginResponse> {
  try {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Login failed',
    };
  }
}

// Verify 2FA
export async function verify2FA(authChallengeId: string, otp: string): Promise<LoginResponse> {
  try {
    const response = await api.post('/auth/verify-2fa', { authChallengeId, otp });
    return response.data;
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || '2FA verification failed',
    };
  }
}

// Register function
export async function register(data: RegisterData): Promise<RegisterResponse> {
  try {
    const response = await api.post('/auth/register', data);
    return response.data;
  } catch (error: any) {
    console.error('Registration error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Registration failed',
      error: error.message,
    };
  }
}

// Logout function
export function logout(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}

// Get current user
export function getCurrentUser(): User | null {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

// Set auth token
export function setAuthToken(token: string, user: User): void {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return !!localStorage.getItem('token');
}

// Check user role
export function hasRole(role: string): boolean {
  const user = getCurrentUser();
  return user?.role === role;
}