import { apiClient, setAccessToken } from "@/lib/apiClient";
import { supabaseClient } from "@/lib/supabaseClient";
import { ApiResponse } from "@/lib/apiTypes";
import { User } from "@/types/user";

interface AuthResult {
  user: User;
  accessToken: string;
}

/**
 * Service Authentication — satu-satunya tempat frontend memanggil endpoint /auth/*
 * (backend), atau Supabase Auth langsung untuk langkah yang memang harus
 * dilakukan di browser (lihat resetPassword di bawah).
 * Dipakai oleh LoginForm, RegisterForm, dan AuthProvider (refresh saat load awal).
 */
export const authService = {
  async register(payload: { namaLengkap: string; email: string; password: string; noHp: string }) {
    // Sengaja TIDAK memanggil setAccessToken() di sini. Alur produk saat ini
    // mengharuskan user login ulang secara eksplisit setelah daftar akun
    // (lihat RegisterForm: redirect ke /login, bukan ke Beranda). Backend juga
    // memang tidak mengembalikan session untuk Register lagi sejak migrasi ke
    // Supabase Auth Admin API (lihat backend authController.js).
    const { data } = await apiClient.post<ApiResponse<AuthResult>>("/auth/register", payload);
    return data.data.user;
  },

  async login(payload: { email: string; password: string }) {
    const { data } = await apiClient.post<ApiResponse<AuthResult>>("/auth/login", payload);
    setAccessToken(data.data.accessToken);
    return data.data.user;
  },

  async logout() {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      // Access token in-memory harus hilang walaupun request ke server gagal
      // (mis. sudah offline/token sudah invalid) — sesi di sisi client tidak boleh
      // tetap "hidup" hanya karena panggilan API-nya gagal.
      setAccessToken(null);
    }
  },

  async me() {
    const { data } = await apiClient.get<ApiResponse<{ user: User }>>("/auth/me");
    return data.data.user;
  },

  /**
   * Langkah 1 Forgot Password. Backend meneruskan permintaan ini ke
   * `supabase.auth.resetPasswordForEmail` (Supabase Auth bawaan) dan SELALU
   * membalas dengan pesan sukses generik yang sama (email ditemukan atau
   * tidak) — lihat authController.js (backend) — supaya tidak mungkin
   * dipakai untuk enumerasi akun. Fungsi ini hanya meneruskan pesan
   * tersebut ke pemanggil, tidak menyembunyikan apa pun lagi di sisi frontend.
   */
  async forgotPassword(payload: { email: string }) {
    const { data } = await apiClient.post<ApiResponse<null>>("/auth/forgot-password", payload);
    return data.message;
  },

  /**
   * Langkah 2 Forgot Password — dipanggil dari halaman /reset-password
   * setelah user membuka link dari email Supabase Auth.
   *
   * BEDA dari fungsi lain di service ini: fungsi ini TIDAK memanggil backend
   * sama sekali. Session recovery dari link email Supabase Auth hanya bisa
   * dibaca oleh browser (lewat URL), jadi penggantian password wajib
   * memakai Supabase Auth langsung (`supabase.auth.updateUser`) lewat
   * `supabaseClient` — persis alur resmi yang direkomendasikan dokumentasi
   * Supabase Auth. Halaman ResetPasswordForm bertanggung jawab memastikan
   * session recovery yang valid sudah ada sebelum memanggil fungsi ini.
   */
  async resetPassword(payload: { password: string }) {
    const { error } = await supabaseClient.auth.updateUser({ password: payload.password });
    if (error) {
      throw error;
    }
    return "Password berhasil diperbarui, silakan login dengan password baru Anda";
  },
};
