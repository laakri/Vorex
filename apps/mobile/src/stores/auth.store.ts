import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../lib/axios';
import { API_URL } from '../config';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: ('ADMIN' | 'SELLER' | 'WAREHOUSE_MANAGER' | 'DRIVER')[];
  isVerifiedSeller?: boolean;
  isVerifiedDriver?: boolean;
  warehouseId?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isVerifiedSeller: boolean;
  isVerifiedDriver: boolean;
  warehouseId: string | null;
  login: (token: string, user: User) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  logout: () => void;
  setVerifiedSeller: (status: boolean) => void;
  setVerifiedDriver: (status: boolean) => void;
}

interface SignUpData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isVerifiedSeller: false,
      isVerifiedDriver: false,
      warehouseId: null,

      login: async (token: string, user: User) => {
        try {
          await AsyncStorage.setItem('token', token);
          set({
            token,
            user,
            isAuthenticated: true,
            isVerifiedSeller: user.isVerifiedSeller || false,
            isVerifiedDriver: user.isVerifiedDriver || false,
            warehouseId: user.warehouseId || null,
          });
        } catch (error) {
          console.error('Error storing token:', error);
          await AsyncStorage.removeItem('token');
          throw error;
        }
      },

      setVerifiedSeller: (status: boolean) => {
        set((state) => ({
          isVerifiedSeller: status,
          user: state.user ? { ...state.user, isVerifiedSeller: status } : null,
        }));
      },

      setVerifiedDriver: (status: boolean) => {
        set((state) => ({
          isVerifiedDriver: status,
          user: state.user ? { ...state.user, isVerifiedDriver: status } : null,
        }));
      },

      signIn: async (email: string, password: string) => {
        try {
          const response = await api.post('/auth/login', { email, password });
          const { token, user } = response.data;
          
          await AsyncStorage.setItem('token', token);
          
          set({
            token,
            user: {
              ...user,
              role: user.role || [],
            },
            isAuthenticated: true,
            isVerifiedSeller: user.isVerifiedSeller || false,
            isVerifiedDriver: user.isVerifiedDriver || false,
            warehouseId: user.warehouseId || null,
          });
        } catch (error) {
          await AsyncStorage.removeItem('token');
          throw error;
        }
      },

      signUp: async (data: SignUpData) => {
        try {
          const response = await api.post('/auth/register', {
            fullName: `${data.firstName} ${data.lastName}`.trim(),
            email: data.email,
            password: data.password,
          });
          set({
            token: response.data.token,
            user: response.data.user,
            isAuthenticated: true,
            isVerifiedSeller: false,
            isVerifiedDriver: false,
            warehouseId: response.data.user.warehouseId || null,
          });
        } catch (error) {
          throw error;
        }
      },

      logout: async () => {
        try {
          await AsyncStorage.removeItem('token');
          set({
            token: null,
            user: null,
            isAuthenticated: false,
            isVerifiedSeller: false,
            isVerifiedDriver: false,
            warehouseId: null,
          });
        } catch (error) {
          console.error('Error removing token:', error);
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
); 