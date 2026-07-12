import { apiClient } from "@/lib/apiClient";
import { ApiResponse } from "@/lib/apiTypes";

export type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
export type FontWeight = "normal" | "medium" | "semibold" | "bold";
export type SizeOption = "small" | "medium" | "large";

export interface Banner {
  id: string;
  isActive: boolean;
  sortOrder: number;
  backgroundImageUrl: string;
  brand: {
    name: string | null;
    logoUrl: string | null;
    logoSize: SizeOption;
  };
  title: {
    text: string;
    color: string;
    heading: HeadingLevel;
    weight: FontWeight;
  };
  subtitle: {
    text: string | null;
    color: string | null;
    heading: HeadingLevel | null;
    weight: FontWeight | null;
  };
  priceNormal: {
    value: number;
    color: string;
    heading: HeadingLevel;
  };
  priceBeforeDiscount: {
    value: number;
    color: string;
    heading: HeadingLevel;
  } | null;
  pricePromo: {
    value: number;
    color: string;
    heading: HeadingLevel;
  };
  limitedOffer: {
    startDate: string;
    endDate: string;
    color: string;
    heading: HeadingLevel;
  } | null;
  cta: {
    text: string;
    link: string;
    bgColor: string;
    textColor: string;
    radius: number;
    size: SizeOption;
  };
  /** Produk tujuan saat banner diklik user di Beranda (Hero Banner). Null = tidak ada aksi klik. */
  targetProduct: {
    id: string;
    namaProduk: string;
    slug: string;
    sku: string | null;
  } | null;
}

/** Payload flat yang dipakai form admin, dikonversi ke FormData sebelum dikirim. */
export interface BannerFormPayload {
  brandName?: string;
  brandLogoSize?: SizeOption;
  brandLogo?: File | null;
  removeBrandLogo?: boolean;

  titleText: string;
  titleColor?: string;
  titleHeading?: HeadingLevel;
  titleWeight?: FontWeight;

  subtitleText?: string;
  subtitleColor?: string;
  subtitleHeading?: HeadingLevel;
  subtitleWeight?: FontWeight;

  priceNormal: number;
  priceNormalColor?: string;
  priceNormalHeading?: HeadingLevel;

  priceBeforeDiscount?: number | null;
  priceBeforeDiscountColor?: string;
  priceBeforeDiscountHeading?: HeadingLevel;

  pricePromo: number;
  pricePromoColor?: string;
  pricePromoHeading?: HeadingLevel;

  offerStartDate?: string;
  offerEndDate?: string;
  offerColor?: string;
  offerHeading?: HeadingLevel;

  ctaText: string;
  ctaLink: string;
  ctaBgColor?: string;
  ctaTextColor?: string;
  ctaRadius?: number;
  ctaSize?: SizeOption;

  isActive?: boolean;
  sortOrder?: number;
  backgroundImage?: File | null;

  /** Id produk tujuan saat banner diklik (opsional). Kirim "" / null untuk mengosongkan. */
  productId?: string | null;
}

function toFormData(payload: BannerFormPayload) {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (key === "backgroundImage" || key === "brandLogo") {
      if (value instanceof File) formData.append(key, value);
      return;
    }
    formData.append(key, String(value));
  });
  return formData;
}

export const bannerService = {
  async getAll({ activeOnly = false }: { activeOnly?: boolean } = {}) {
    const { data } = await apiClient.get<ApiResponse<Banner[]>>("/banners", { params: { activeOnly } });
    return data.data;
  },

  async create(payload: BannerFormPayload) {
    const { data } = await apiClient.post<ApiResponse<Banner>>("/banners", toFormData(payload), {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },

  async update(id: string, payload: Partial<BannerFormPayload>) {
    const { data } = await apiClient.put<ApiResponse<Banner>>(`/banners/${id}`, toFormData(payload as BannerFormPayload), {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },

  async remove(id: string) {
    await apiClient.delete(`/banners/${id}`);
  },

  async reorder(order: { id: string; sortOrder: number }[]) {
    const { data } = await apiClient.patch<ApiResponse<Banner[]>>("/banners/reorder", { order });
    return data.data;
  },
};
