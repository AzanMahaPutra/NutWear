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

/**
 * UPDATE #1 — Rate limit login. Mengenali HTTP 429 dari backend dan mengambil
 * waktu tunggu (detik) dari header `Retry-After` (fallback: `retryAfterSeconds`
 * di body JSON). Mengembalikan null kalau error BUKAN 429. `retryAfterSeconds`
 * bernilai null kalau backend tidak memberi informasi waktu tunggu.
 */
export function getRateLimitInfo(error: unknown): { retryAfterSeconds: number | null } | null {
  if (!(error instanceof AxiosError) || error.response?.status !== 429) return null;

  const headerValue = error.response.headers?.["retry-after"];
  let seconds = Number(headerValue);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    // Retry-After boleh berupa HTTP-date, bukan hanya detik.
    const asDate = typeof headerValue === "string" ? Date.parse(headerValue) : NaN;
    seconds = Number.isFinite(asDate) ? (asDate - Date.now()) / 1000 : NaN;
  }
  if (!Number.isFinite(seconds) || seconds <= 0) {
    seconds = Number((error.response.data as { retryAfterSeconds?: number } | undefined)?.retryAfterSeconds);
  }

  return { retryAfterSeconds: Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : null };
}

/** "10 menit" / "45 detik" — untuk pesan waktu tunggu rate limit. */
export function formatRetryAfter(seconds: number): string {
  return seconds >= 60 ? `${Math.ceil(seconds / 60)} menit` : `${seconds} detik`;
}
