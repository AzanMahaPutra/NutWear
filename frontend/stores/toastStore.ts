import { create } from "zustand";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

interface ToastState {
  toasts: Toast[];
  showToast: (message: string, type?: "success" | "error") => void;
  dismissToast: (id: number) => void;
}

/**
 * Store notifikasi toast global, reusable di seluruh halaman
 * (add to cart, add to wishlist, checkout berhasil, error validasi, dll).
 */
export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  showToast: (message, type = "success") => {
    const id = Date.now();
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 3000);
  },
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
