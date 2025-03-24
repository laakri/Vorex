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
  warehouseId?:string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isVerifiedSeller: boolean;
  isVerifiedDriver: boolean;
  warehouseId: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
  setVerifiedSeller: (status: boolean) => void;
  setVerifiedDriver: (status: boolean) => void;
  signInWithGoogle: () => void;
  handleGoogleCallback: (token: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null as string | null,
      user: null as User | null,
      isAuthenticated: false,
      isVerifiedSeller: false,
      isVerifiedDriver: false,
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
          warehouseId: response.data.user.warehouseId || null,
        });
        api.defaults.headers.common["Authorization"] = `Bearer ${response.data.token}`;
      },

      signUp: async ({ firstName, lastName, email, password }) => {
        const response = await api.post("/auth/register", {
          fullName: `${firstName} ${lastName}`.trim(),
          email,
          password,
        });
        set({
          token: response.data.token,
          user: response.data.user,
          isAuthenticated: true,
          isVerifiedSeller: false,
          isVerifiedDriver: false,
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
          warehouseId: null,
        });
        delete api.defaults.headers.common["Authorization"];
      },

      signInWithGoogle: () => {
        window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
      },

      handleGoogleCallback: async (token: string) => {
        const response = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        set({
          token,
          user: response.data,
          isAuthenticated: true,
          isVerifiedSeller: response.data.isVerifiedSeller || false,
          isVerifiedDriver: response.data.isVerifiedDriver || false,
        });
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      },
    }),
    {
      name: "auth-storage",
    }
  )
);
