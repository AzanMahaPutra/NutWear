import { create } from "zustand";
import { heroBannerService, HeroBanner, HeroBannerFormPayload } from "@/services/heroBannerService";

interface AdminHeroBannerState {
  heroBanners: HeroBanner[];
  isLoading: boolean;
  fetchHeroBanners: () => Promise<void>;
  addHeroBanner: (payload: HeroBannerFormPayload) => Promise<void>;
  updateHeroBanner: (id: string, payload: Partial<HeroBannerFormPayload>) => Promise<void>;
  deleteHeroBanner: (id: string) => Promise<void>;
  toggleActive: (id: string, current: boolean) => Promise<void>;
  moveHeroBanner: (id: string, direction: "up" | "down") => Promise<void>;
}

export const useAdminHeroBannerStore = create<AdminHeroBannerState>((set, get) => ({
  heroBanners: [],
  isLoading: false,

  fetchHeroBanners: async () => {
    set({ isLoading: true });
    try {
      const heroBanners = await heroBannerService.getAll();
      set({ heroBanners });
    } finally {
      set({ isLoading: false });
    }
  },

  addHeroBanner: async (payload) => {
    const created = await heroBannerService.create(payload);
    set({ heroBanners: [created, ...get().heroBanners] });
  },

  updateHeroBanner: async (id, payload) => {
    const updated = await heroBannerService.update(id, payload);
    set({ heroBanners: get().heroBanners.map((b) => (b.id === id ? updated : b)) });
  },

  deleteHeroBanner: async (id) => {
    await heroBannerService.remove(id);
    set({ heroBanners: get().heroBanners.filter((b) => b.id !== id) });
  },

  toggleActive: async (id, current) => {
    const updated = await heroBannerService.update(id, { isActive: !current });
    set({ heroBanners: get().heroBanners.map((b) => (b.id === id ? updated : b)) });
  },

  moveHeroBanner: async (id, direction) => {
    const sorted = [...get().heroBanners].sort((a, b) => a.sortOrder - b.sortOrder);
    const index = sorted.findIndex((b) => b.id === id);
    if (index === -1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const current = sorted[index];
    const target = sorted[targetIndex];

    // Tukar sortOrder dua hero banner yang bersebelahan saja. Request dikirim
    // dulu ke server; state lokal baru diperbarui setelah server mengonfirmasi
    // berhasil, supaya urutan di UI tidak berubah kalau penyimpanan gagal.
    const updated = await heroBannerService.reorder([
      { id: current.id, sortOrder: target.sortOrder },
      { id: target.id, sortOrder: current.sortOrder },
    ]);

    set({ heroBanners: updated });
  },
}));
