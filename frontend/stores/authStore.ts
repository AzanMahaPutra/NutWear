import { create } from "zustand";
import { User } from "@/types/user";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean; // true selagi AuthProvider mencoba silent refresh saat load awal
  setUser: (user: User | null) => void;
  setInitializing: (value: boolean) => void;
}

/**
 * Store sesi user (bukan lagi dummy). Diisi oleh AuthProvider (silent refresh)
 * atau langsung setelah login/register berhasil (lihat authService & LoginForm).
 * TIDAK di-persist ke localStorage — sumber kebenaran sesi ada di httpOnly cookie
 * refresh token di backend, store ini hanya cache tampilan di sisi client.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitializing: true,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setInitializing: (value) => set({ isInitializing: value }),
}));

