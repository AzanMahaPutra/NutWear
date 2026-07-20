import { create } from "zustand";
import { bannerService, Banner, BannerFormPayload } from "@/services/bannerService";
import { revalidateHomepage } from "@/lib/revalidateHomepage";

interface AdminBannerState {
  banners: Banner[];
  isLoading: boolean;
  fetchBanners: () => Promise<void>;
  addBanner: (payload: BannerFormPayload) => Promise<void>;
  updateBanner: (id: string, payload: Partial<BannerFormPayload>) => Promise<void>;
  deleteBanner: (id: string) => Promise<void>;
  toggleActive: (id: string, current: boolean) => Promise<void>;
  moveBanner: (id: string, direction: "up" | "down") => Promise<void>;
}

export const useAdminBannerStore = create<AdminBannerState>((set, get) => ({
  banners: [],
  isLoading: false,

  fetchBanners: async () => {
    set({ isLoading: true });
    try {
      const banners = await bannerService.getAll();
      set({ banners });
    } finally {
      set({ isLoading: false });
    }
  },

  addBanner: async (payload) => {
    const created = await bannerService.create(payload);
    set({ banners: [created, ...get().banners] });
    revalidateHomepage();
  },

  updateBanner: async (id, payload) => {
    const updated = await bannerService.update(id, payload);
    set({ banners: get().banners.map((b) => (b.id === id ? updated : b)) });
    revalidateHomepage();
  },

  deleteBanner: async (id) => {
    await bannerService.remove(id);
    set({ banners: get().banners.filter((b) => b.id !== id) });
    revalidateHomepage();
  },

  toggleActive: async (id, current) => {
    const updated = await bannerService.update(id, { isActive: !current });
    set({ banners: get().banners.map((b) => (b.id === id ? updated : b)) });
    revalidateHomepage();
  },

  moveBanner: async (id, direction) => {
    const sorted = [...get().banners].sort((a, b) => a.sortOrder - b.sortOrder);
    const index = sorted.findIndex((b) => b.id === id);
    if (index === -1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const current = sorted[index];
    const target = sorted[targetIndex];

    // Tukar sortOrder dua banner yang bersebelahan saja. Request dikirim dulu
    // ke server; state lokal baru diperbarui setelah server mengonfirmasi
    // berhasil, supaya urutan di UI tidak berubah kalau penyimpanan gagal.
    const updatedBanners = await bannerService.reorder([
      { id: current.id, sortOrder: target.sortOrder },
      { id: target.id, sortOrder: current.sortOrder },
    ]);

    set({ banners: updatedBanners });
    revalidateHomepage();
  },
}));
