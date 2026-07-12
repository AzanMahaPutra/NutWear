import { apiClient } from "@/lib/apiClient";
import { ApiResponse } from "@/lib/apiTypes";
import { Category } from "@/types/product";

interface CategoryPayload {
  namaKategori: string;
  image?: File | null;
  removeImage?: boolean;
}

function toFormData({ namaKategori, image, removeImage }: CategoryPayload) {
  const fd = new FormData();
  fd.append("namaKategori", namaKategori);
  if (image) fd.append("image", image);
  if (removeImage) fd.append("removeImage", "true");
  return fd;
}

export const categoryService = {
  async getAll() {
    const { data } = await apiClient.get<ApiResponse<Category[]>>("/categories");
    return data.data;
  },

  async create(payload: CategoryPayload) {
    const { data } = await apiClient.post<ApiResponse<Category>>("/categories", toFormData(payload), {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },

  async update(id: string, payload: Partial<CategoryPayload>) {
    const { data } = await apiClient.put<ApiResponse<Category>>(
      `/categories/${id}`,
      toFormData({ namaKategori: payload.namaKategori ?? "", ...payload }),
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return data.data;
  },

  async remove(id: string) {
    await apiClient.delete(`/categories/${id}`);
  },
};
