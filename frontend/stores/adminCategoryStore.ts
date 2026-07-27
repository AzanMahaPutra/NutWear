import { create } from "zustand";
import { Category } from "@/types/product";
import { categoryService } from "@/services/categoryService";
import { revalidateHomepage } from "@/lib/revalidateHomepage";

interface AdminCategoryState {
  categories: Category[];
  isLoading: boolean;
  fetchCategories: () => Promise<void>;
  addCategory: (namaKategori: string, image?: File | null) => Promise<void>;
  updateCategory: (id: string, namaKategori: string, image?: File | null, removeImage?: boolean) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  /** Simpan urutan kategori baru (ids sudah dalam urutan hasil drag & drop) ke database. */
  reorderCategories: (orderedIds: string[]) => Promise<void>;
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
    // Kategori baru selalu diberi sort_order paling akhir oleh backend (lihat
    // services/categoryService.js createCategory), jadi ditambahkan ke akhir
    // daftar supaya urutan di tabel Admin tetap konsisten dengan urutan tampil
    // di website.
    set({ categories: [...get().categories, created] });
  },

  updateCategory: async (id, namaKategori, image, removeImage) => {
    const updated = await categoryService.update(id, { namaKategori, image, removeImage });
    set({ categories: get().categories.map((c) => (c.id === id ? updated : c)) });
  },

  deleteCategory: async (id) => {
    await categoryService.remove(id);
    set({ categories: get().categories.filter((c) => c.id !== id) });
  },

  reorderCategories: async (orderedIds) => {
    const previous = get().categories;

    // Update tampilan Admin dulu (urutan sudah sesuai hasil drag & drop di UI),
    // request ke server dikirim di belakang. Kalau server gagal, urutan lama
    // dikembalikan supaya tidak menyimpan urutan yang salah.
    const byId = new Map(previous.map((c) => [c.id, c]));
    const optimistic = orderedIds.map((id) => byId.get(id)).filter((c): c is Category => Boolean(c));
    set({ categories: optimistic });

    try {
      const order = orderedIds.map((id, index) => ({ id, sortOrder: index }));
      const updated = await categoryService.reorder(order);
      set({ categories: updated });
      revalidateHomepage();
    } catch (err) {
      set({ categories: previous });
      throw err;
    }
  },
}));
