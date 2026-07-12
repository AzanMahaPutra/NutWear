import { apiClient } from "@/lib/apiClient";
import { ApiResponse } from "@/lib/apiTypes";
import { Product, ProductFeature, ProductVariant } from "@/types/product";

interface GetProductsParams {
  categoryId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

interface ProductListMeta {
  page: number;
  pageSize: number;
  total: number;
}

export interface PairedProduct {
  id: string;
  namaProduk: string;
  slug: string;
  harga: number;
  imageUrl: string | null;
}

/** UPDATE 3 — Pasangan Produk per foto Gallery: info lebih lengkap dari PairedProduct lama. */
export interface PairedProductDetail {
  id: string;
  namaProduk: string;
  slug: string;
  harga: number;
  hargaPromo: number | null;
  hargaPromoColor: string;
  isPromoActive: boolean;
  isNewArrival: boolean;
  warna: string | null;
  imageUrl: string | null;
}

/** Info "Produk Utama" (foto yang dipilih user) untuk header halaman Pasangan Produk. */
export interface ImagePairingContext {
  imageId: string;
  imageUrl: string;
  warna: string | null;
  product: {
    id: string;
    namaProduk: string;
    slug: string;
    harga: number;
  };
}

/**
 * Service Product — dipakai halaman Shop, Detail Produk, dan Admin Manajemen Produk.
 * Bentuk response backend sudah camelCase (lihat productService.js toResponse),
 * jadi tidak perlu mapping tambahan di sini.
 */
export const productService = {
  async getAll(params: GetProductsParams = {}) {
    const { data } = await apiClient.get<ApiResponse<Product[]> & { meta: ProductListMeta }>("/products", { params });
    return { items: data.data, meta: data.meta };
  },

  async getById(id: string) {
    const { data } = await apiClient.get<ApiResponse<Product>>(`/products/${id}`);
    return data.data;
  },

  async getBySlug(slug: string) {
    const { data } = await apiClient.get<ApiResponse<Product>>(`/products/slug/${slug}`);
    return data.data;
  },

  async create(payload: {
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
  }) {
    const { data } = await apiClient.post<ApiResponse<Product>>("/products", payload);
    return data.data;
  },

  async update(
    id: string,
    payload: Partial<{
      namaProduk: string;
      categoryId: string;
      harga: number;
      hargaPromo: number | null;
      hargaPromoColor: string | null;
      promoMulai: string | null;
      promoSelesai: string | null;
      berat: number;
      deskripsi: string;
      isActive: boolean;
      isNewArrival: boolean;
      gender: "pria" | "wanita" | "uniseks";
    }>
  ) {
    const { data } = await apiClient.put<ApiResponse<Product>>(`/products/${id}`, payload);
    return data.data;
  },

  async remove(id: string) {
    await apiClient.delete(`/products/${id}`);
  },

  async addVariant(productId: string, payload: { ukuran: string; warna: string; sku: string; stok: number }) {
    const { data } = await apiClient.post<ApiResponse<ProductVariant>>(`/products/${productId}/variants`, payload);
    return data.data;
  },

  async updateVariant(variantId: string, payload: Partial<{ ukuran: string; warna: string; sku: string; stok: number }>) {
    const { data } = await apiClient.put<ApiResponse<ProductVariant>>(`/products/variants/${variantId}`, payload);
    return data.data;
  },

  async removeVariant(variantId: string) {
    await apiClient.delete(`/products/variants/${variantId}`);
  },

  /** warna diisi -> upload/ganti foto utama khusus warna itu. Kosongkan untuk foto galeri umum. */
  async uploadImage(productId: string, file: File, options: { sortOrder?: number; warna?: string } = {}) {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("sortOrder", String(options.sortOrder ?? 0));
    if (options.warna) formData.append("warna", options.warna);
    const { data } = await apiClient.post(`/products/${productId}/images`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },

  async removeImage(imageId: string) {
    await apiClient.delete(`/products/images/${imageId}`);
  },

  // --- Fitur Produk dengan Gambar (UPDATE 4). UPDATE 6: field `judul` dihapus,
  // fitur sekarang hanya gambar + deskripsi. ---

  async addFeature(
    productId: string,
    payload: { file: File; deskripsi: string; sortOrder?: number }
  ) {
    const formData = new FormData();
    formData.append("image", payload.file);
    formData.append("deskripsi", payload.deskripsi);
    if (payload.sortOrder !== undefined) formData.append("sortOrder", String(payload.sortOrder));
    const { data } = await apiClient.post<ApiResponse<ProductFeature>>(`/products/${productId}/features`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },

  async updateFeature(
    featureId: string,
    payload: { file?: File; deskripsi?: string; sortOrder?: number }
  ) {
    const formData = new FormData();
    if (payload.file) formData.append("image", payload.file);
    if (payload.deskripsi !== undefined) formData.append("deskripsi", payload.deskripsi);
    if (payload.sortOrder !== undefined) formData.append("sortOrder", String(payload.sortOrder));
    const { data } = await apiClient.put<ApiResponse<ProductFeature>>(`/products/features/${featureId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },

  async removeFeature(featureId: string) {
    await apiClient.delete(`/products/features/${featureId}`);
  },

  async getPairs(productId: string) {
    const { data } = await apiClient.get<ApiResponse<PairedProduct[]>>(`/products/${productId}/pairs`);
    return data.data;
  },

  async addPair(productId: string, sku: string) {
    const { data } = await apiClient.post<ApiResponse<PairedProduct[]>>(`/products/${productId}/pairs`, { sku });
    return data.data;
  },

  async removePair(productId: string, pairedProductId: string) {
    const { data } = await apiClient.delete<ApiResponse<PairedProduct[]>>(`/products/${productId}/pairs/${pairedProductId}`);
    return data.data;
  },

  // --- Pasangan Produk per Foto Gallery (UPDATE 3) ---

  async getImagePairingContext(imageId: string) {
    const { data } = await apiClient.get<ApiResponse<ImagePairingContext>>(`/products/images/${imageId}/pairing-context`);
    return data.data;
  },

  async getImagePairs(imageId: string) {
    const { data } = await apiClient.get<ApiResponse<PairedProductDetail[]>>(`/products/images/${imageId}/pairs`);
    return data.data;
  },

  async addImagePair(imageId: string, productId: string) {
    const { data } = await apiClient.post<ApiResponse<PairedProductDetail[]>>(`/products/images/${imageId}/pairs`, {
      productId,
    });
    return data.data;
  },

  async removeImagePair(imageId: string, pairedProductId: string) {
    const { data } = await apiClient.delete<ApiResponse<PairedProductDetail[]>>(
      `/products/images/${imageId}/pairs/${pairedProductId}`
    );
    return data.data;
  },
};
