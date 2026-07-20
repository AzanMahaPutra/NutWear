import { apiClient, setAccessToken } from "@/lib/apiClient";
import { ApiResponse } from "@/lib/apiTypes";
import { User } from "@/types/user";

interface AuthResult {
  user: User;
  accessToken: string;
}

/**
 * Service Authentication — satu-satunya tempat frontend memanggil endpoint /auth/*.
 * Dipakai oleh LoginForm, RegisterForm, dan AuthProvider (refresh saat load awal).
 */
export const authService = {
  async register(payload: { namaLengkap: string; email: string; password: string; noHp: string }) {
    // Sengaja TIDAK memanggil setAccessToken() di sini. Alur produk saat ini
    // mengharuskan user login ulang secara eksplisit setelah daftar akun
    // (lihat RegisterForm: redirect ke /login, bukan ke Beranda). Kalau access
    // token tetap disimpan in-memory di titik ini, apiClient akan diam-diam
    // melampirkan Authorization header untuk user yang menurut authStore
    // masih dianggap belum login — state yang tidak konsisten dan berpotensi
    // membingungkan alur auth lain di aplikasi.
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
};
