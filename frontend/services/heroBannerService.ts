import { apiClient } from "@/lib/apiClient";
import { ApiResponse } from "@/lib/apiTypes";

export type HeroBannerLinkType = "none" | "product" | "category" | "custom";

export interface HeroBanner {
  id: string;
  imageUrl: string;
  title: string | null;
  isActive: boolean;
  sortOrder: number;
  link: {
    type: HeroBannerLinkType;
    customUrl: string | null;
    product: {
      id: string;
      namaProduk: string;
      slug: string;
      sku: string | null;
    } | null;
    category: {
      id: string;
      namaKategori: string;
    } | null;
  };
}

/** Payload flat yang dipakai form admin, dikonversi ke FormData sebelum dikirim. */
export interface HeroBannerFormPayload {
  title?: string;
  linkType?: HeroBannerLinkType;
  productId?: string | null;
  categoryId?: string | null;
  customUrl?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  image?: File | null;
}

function toFormData(payload: HeroBannerFormPayload) {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (key === "image") {
      if (value instanceof File) formData.append(key, value);
      return;
    }
    formData.append(key, String(value));
  });
  return formData;
}

export const heroBannerService = {
  async getAll({ activeOnly = false }: { activeOnly?: boolean } = {}) {
    const { data } = await apiClient.get<ApiResponse<HeroBanner[]>>("/hero-banners", { params: { activeOnly } });
    return data.data;
  },

  async create(payload: HeroBannerFormPayload) {
    const { data } = await apiClient.post<ApiResponse<HeroBanner>>("/hero-banners", toFormData(payload), {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },

  async update(id: string, payload: Partial<HeroBannerFormPayload>) {
    const { data } = await apiClient.put<ApiResponse<HeroBanner>>(
      `/hero-banners/${id}`,
      toFormData(payload as HeroBannerFormPayload),
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return data.data;
  },

  async remove(id: string) {
    await apiClient.delete(`/hero-banners/${id}`);
  },

  async reorder(order: { id: string; sortOrder: number }[]) {
    const { data } = await apiClient.patch<ApiResponse<HeroBanner[]>>("/hero-banners/reorder", { order });
    return data.data;
  },
};
