import { AxiosError } from "axios";

/**
 * Bentuk response API backend (lihat utils/response.js di backend) — reusable
 * sebagai generic type di seluruh service.
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

/**
 * Ekstrak pesan error yang ramah pengguna dari AxiosError, reusable di seluruh
 * service/komponen supaya tidak perlu menulis ulang optional chaining berulang.
 */
export function getApiErrorMessage(error: unknown, fallback = "Terjadi kesalahan, silakan coba lagi"): string {
  if (error instanceof AxiosError) {
    return (error.response?.data as { message?: string })?.message ?? fallback;
  }
  return fallback;
}
