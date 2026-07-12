import { create } from "zustand";
import { Product } from "@/types/product";
import { productService } from "@/services/productService";

interface AdminProductState {
  products: Product[];
  isLoading: boolean;
  fetchProducts: () => Promise<void>;
  addProduct: (payload: {
    namaProduk: string;
    categoryId: string;
    harga: number;
    hargaPromo?: number | null;
    hargaPromoColor?: string;
    promoMulai?: string | null;
    promoSelesai?: string | null;
    berat: number;
    deskripsi: string;
    isNewArrival?: boolean;
    gender: "pria" | "wanita" | "uniseks";
    detailInfo?: string;
    materialCareInfo?: string;
    shippingReturnInfo?: string;
    productionInfo?: string;
  }) => Promise<Product>;
  updateProduct: (id: string, data: Partial<Product> & { categoryId?: string }) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  toggleActive: (id: string, current: boolean) => Promise<void>;
}

/**
 * Store Admin Produk — cache di client, sumber data sebenarnya dari Product API.
 */
export const useAdminProductStore = create<AdminProductState>((set, get) => ({
  products: [],
  isLoading: false,

  fetchProducts: async () => {
    set({ isLoading: true });
    try {
      const { items } = await productService.getAll({ pageSize: 100 });
      set({ products: items });
    } finally {
      set({ isLoading: false });
    }
  },

  addProduct: async (payload) => {
    const created = await productService.create(payload);
    set({ products: [created, ...get().products] });
    return created;
  },

  updateProduct: async (id, data) => {
    const updated = await productService.update(id, data);
    set({ products: get().products.map((p) => (p.id === id ? updated : p)) });
  },

  deleteProduct: async (id) => {
    await productService.remove(id);
    set({ products: get().products.filter((p) => p.id !== id) });
  },

  toggleActive: async (id, current) => {
    const updated = await productService.update(id, { isActive: !current });
    set({ products: get().products.map((p) => (p.id === id ? updated : p)) });
  },
}));
