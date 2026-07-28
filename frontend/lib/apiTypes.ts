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
 * Ekstrak pesan error yang ramah pengguna dari AxiosError ATAU dari error
 * Supabase Auth (mis. saat Reset Password — lihat authService.resetPassword),
 * reusable di seluruh service/komponen supaya tidak perlu menulis ulang
 * optional chaining berulang.
 */
export function getApiErrorMessage(error: unknown, fallback = "Terjadi kesalahan, silakan coba lagi"): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string; errors?: Array<{ field: string; message: string }> };
    if (data?.errors && data.errors.length > 0) {
      return data.errors[0].message;
    }
    return data?.message ?? fallback;
  }
  // Error dari supabase-js (mis. AuthError) berbentuk Error biasa dengan `.message`.
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
