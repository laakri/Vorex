import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/lib/axios";

interface User {
  id: string;
  email: string;
  fullName: string;
  role: "ADMIN" | "SELLER" | "WAREHOUSE_MANAGER" | "DRIVER";
  isVerifiedSeller?: boolean;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isVerifiedSeller: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
  setVerifiedSeller: (status: boolean) => void;
  signInWithGoogle: () => void;
  handleGoogleCallback: (token: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isVerifiedSeller: false,

      setVerifiedSeller: (status: boolean) => {
        set((state) => ({
          isVerifiedSeller: status,
          user: state.user ? { ...state.user, isVerifiedSeller: status } : null,
        }));
      },

      signIn: async (email: string, password: string) => {
        const response = await api.post("/auth/login", { email, password });
        set({
          token: response.data.token,
          user: response.data.user,
          isAuthenticated: true,
          isVerifiedSeller: response.data.user.isVerifiedSeller || false,
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
        });
        api.defaults.headers.common["Authorization"] = `Bearer ${response.data.token}`;
      },

      logout: () => {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          isVerifiedSeller: false,
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
        });
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      },
    }),
    {
      name: "auth-storage",
    }
  )
);
