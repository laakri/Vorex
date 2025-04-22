import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/lib/axios";

interface User {
  id: string;
  email: string;
  fullName: string;
  role: ("ADMIN" | "SELLER" | "WAREHOUSE_MANAGER" | "DRIVER")[];
  isVerifiedSeller?: boolean;
  isVerifiedDriver?: boolean;
  isEmailVerified?: boolean;
  warehouseId?:string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isVerifiedSeller: boolean;
  isVerifiedDriver: boolean;
  isEmailVerified: boolean;
  warehouseId: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: {
    fullName: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
  setVerifiedSeller: (status: boolean) => void;
  setVerifiedDriver: (status: boolean) => void;
  signInWithGoogle: () => void;
  handleGoogleCallback: (token: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null as string | null,
      user: null as User | null,
      isAuthenticated: false,
      isVerifiedSeller: false,
      isVerifiedDriver: false,
      isEmailVerified: false,
      warehouseId: null as string | null,

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
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          isVerifiedSeller: false,
          isVerifiedDriver: false,
          isEmailVerified: false,
          warehouseId: null,
        });
        delete api.defaults.headers.common["Authorization"];
        
        const response = await api.post("/auth/login", { email, password });
        set({
          token: response.data.token,
          user: {
            ...response.data.user,
            role: response.data.user.role || [],
          },
          isAuthenticated: true,
          isVerifiedSeller: response.data.user.isVerifiedSeller || false,
          isVerifiedDriver: response.data.user.isVerifiedDriver || false,
          isEmailVerified: response.data.user.isEmailVerified || false,
          warehouseId: response.data.user.warehouseId || null,
        });
        api.defaults.headers.common["Authorization"] = `Bearer ${response.data.token}`;
      },

      signUp: async ({ fullName, email, password }) => {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          isVerifiedSeller: false,
          isVerifiedDriver: false,
          isEmailVerified: false,
          warehouseId: null,
        });
        delete api.defaults.headers.common["Authorization"];
        
        const response = await api.post("/auth/register", {
          fullName,
          email,
          password,
        });
        set({
          token: response.data.token,
          user: response.data.user,
          isAuthenticated: true,
          isVerifiedSeller: false,
          isVerifiedDriver: false,
          isEmailVerified: response.data.user.isEmailVerified || false,
          warehouseId: response.data.user.warehouseId || null,
        });
        api.defaults.headers.common["Authorization"] = `Bearer ${response.data.token}`;
      },

      logout: () => {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          isVerifiedSeller: false,
          isVerifiedDriver: false,
          isEmailVerified: false,
          warehouseId: null,
        });
        delete api.defaults.headers.common["Authorization"];
      },

      signInWithGoogle: () => {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          isVerifiedSeller: false,
          isVerifiedDriver: false,
          isEmailVerified: false,
          warehouseId: null,
        });
        delete api.defaults.headers.common["Authorization"];
        
        window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
      },

      handleGoogleCallback: async (token: string) => {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          isVerifiedSeller: false,
          isVerifiedDriver: false,
          isEmailVerified: false,
          warehouseId: null,
        });
        delete api.defaults.headers.common["Authorization"];
        
        const response = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        set({
          token,
          user: response.data,
          isAuthenticated: true,
          isVerifiedSeller: response.data.isVerifiedSeller || false,
          isVerifiedDriver: response.data.isVerifiedDriver || false,
          isEmailVerified: response.data.isEmailVerified || false,
          warehouseId: response.data.warehouseId || null,
        });
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      },

      requestPasswordReset: async (email: string) => {
        await api.post('/auth/forgot-password', { email });
      },

      resetPassword: async (token: string, password: string) => {
        await api.post('/auth/reset-password', { token, password });
      },

      resendVerificationEmail: async (email: string) => {
        await api.post('/auth/resend-verification', { email });
      },
    }),
    {
      name: "auth-storage",
    }
  )
);
