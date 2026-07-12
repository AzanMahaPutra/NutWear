import { create } from "zustand";
import { Category } from "@/types/product";
import { categoryService } from "@/services/categoryService";

interface AdminCategoryState {
  categories: Category[];
  isLoading: boolean;
  fetchCategories: () => Promise<void>;
  addCategory: (namaKategori: string, image?: File | null) => Promise<void>;
  updateCategory: (id: string, namaKategori: string, image?: File | null, removeImage?: boolean) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

export const useAdminCategoryStore = create<AdminCategoryState>((set, get) => ({
  categories: [],
  isLoading: false,

  fetchCategories: async () => {
    set({ isLoading: true });
    try {
      const categories = await categoryService.getAll();
      set({ categories });
    } finally {
      set({ isLoading: false });
    }
  },

  addCategory: async (namaKategori, image) => {
    const created = await categoryService.create({ namaKategori, image });
    set({ categories: [created, ...get().categories] });
  },

  updateCategory: async (id, namaKategori, image, removeImage) => {
    const updated = await categoryService.update(id, { namaKategori, image, removeImage });
    set({ categories: get().categories.map((c) => (c.id === id ? updated : c)) });
  },

  deleteCategory: async (id) => {
    await categoryService.remove(id);
    set({ categories: get().categories.filter((c) => c.id !== id) });
  },
}));
