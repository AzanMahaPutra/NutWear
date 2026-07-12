import { create } from "zustand";
import { CartItem } from "@/types/user";
import { cartService, CartApiItem } from "@/services/cartService";
import { getEffectivePrice } from "@/utils/promo";

function toCartItem(raw: CartApiItem): CartItem {
  return {
    id: raw.id,
    variantId: raw.variantId,
    productId: raw.productId,
    namaProduk: raw.namaProduk,
    slug: raw.slug,
    imageUrl: raw.imageUrl,
    warna: raw.warna,
    ukuran: raw.ukuran,
    harga: raw.harga,
    hargaPromo: raw.hargaPromo,
    hargaPromoColor: raw.hargaPromoColor,
    isPromoActive: raw.isPromoActive,
    hargaEfektif: raw.hargaEfektif,
    quantity: raw.quantity,
    stokTersedia: raw.stokTersedia,
  };
}

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  /** Id item Cart yang sedang dicentang user (Update 5, Bagian B — fitur check item). */
  selectedIds: Set<string>;
  fetchCart: () => Promise<void>;
  addItem: (variantId: string, quantity: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: () => number;
  totalPrice: () => number;
  /** Toggle centang satu item. */
  toggleSelect: (itemId: string) => void;
  /** Centang/lepas semua item sekaligus (checkbox "Pilih Semua"). */
  selectAll: (checked: boolean) => void;
  isSelected: (itemId: string) => boolean;
  /** true jika seluruh item cart sedang tercentang (untuk state checkbox "Pilih Semua"). */
  isAllSelected: () => boolean;
  /** Daftar item yang sedang tercentang — inilah yang diproses ke Checkout. */
  selectedItems: () => CartItem[];
  selectedTotalPrice: () => number;
}

/**
 * Store keranjang belanja global, sinkron dengan Cart API sungguhan.
 * Dipanggil ulang (fetchCart) setiap kali halaman Keranjang/Navbar butuh data terbaru.
 *
 * `selectedIds` menyimpan item mana yang sedang dicentang user (fitur check item pada
 * Cart, Update 5 Bagian B). Secara default seluruh item baru (baik saat pertama kali
 * cart dimuat maupun item yang baru ditambahkan) otomatis tercentang, supaya perilaku
 * tombol Checkout tetap konsisten dengan sebelumnya selama user tidak melepas centang.
 */
export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isLoading: false,
  selectedIds: new Set(),

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const raw = await cartService.getAll();
      const items = raw.map(toCartItem);
      set((state) => {
        const previousIds = new Set(state.items.map((i) => i.id));
        const nextSelected = new Set<string>();
        items.forEach((item) => {
          // Item yang belum pernah terlihat sebelumnya (baru ditambahkan) default tercentang;
          // item yang sudah ada mengikuti status centang sebelumnya.
          if (!previousIds.has(item.id) || state.selectedIds.has(item.id)) {
            nextSelected.add(item.id);
          }
        });
        return { items, selectedIds: nextSelected };
      });
    } finally {
      set({ isLoading: false });
    }
  },

  addItem: async (variantId, quantity) => {
    await cartService.add({ variantId, quantity });
    await get().fetchCart();
  },

  updateQuantity: async (itemId, quantity) => {
    await cartService.updateQuantity(itemId, quantity);
    set((state) => ({
      items: state.items.map((i) => (i.id === itemId ? { ...i, quantity } : i)),
    }));
  },

  removeItem: async (itemId) => {
    await cartService.remove(itemId);
    set((state) => {
      const nextSelected = new Set(state.selectedIds);
      nextSelected.delete(itemId);
      return { items: state.items.filter((i) => i.id !== itemId), selectedIds: nextSelected };
    });
  },

  clearCart: async () => {
    await cartService.clear();
    set({ items: [], selectedIds: new Set() });
  },

  totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
  // UPDATE 3 — pakai getEffectivePrice (harga promo kalau promo masih aktif) bukan i.harga
  // langsung, supaya Total Cart konsisten dengan harga yang ditampilkan per item.
  totalPrice: () => get().items.reduce((sum, i) => sum + getEffectivePrice(i) * i.quantity, 0),

  toggleSelect: (itemId) =>
    set((state) => {
      const next = new Set(state.selectedIds);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return { selectedIds: next };
    }),

  selectAll: (checked) =>
    set((state) => ({
      selectedIds: checked ? new Set(state.items.map((i) => i.id)) : new Set(),
    })),

  isSelected: (itemId) => get().selectedIds.has(itemId),

  isAllSelected: () => {
    const { items, selectedIds } = get();
    return items.length > 0 && items.every((i) => selectedIds.has(i.id));
  },

  selectedItems: () => {
    const { items, selectedIds } = get();
    return items.filter((i) => selectedIds.has(i.id));
  },

  selectedTotalPrice: () => get().selectedItems().reduce((sum, i) => sum + getEffectivePrice(i) * i.quantity, 0),
}));
