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
    const { data } = await apiClient.post<ApiResponse<AuthResult>>("/auth/register", payload);
    setAccessToken(data.data.accessToken);
    return data.data.user;
  },

  async login(payload: { email: string; password: string }) {
    const { data } = await apiClient.post<ApiResponse<AuthResult>>("/auth/login", payload);
    setAccessToken(data.data.accessToken);
    return data.data.user;
  },

  async logout() {
    await apiClient.post("/auth/logout");
    setAccessToken(null);
  },

  async me() {
    const { data } = await apiClient.get<ApiResponse<{ user: User }>>("/auth/me");
    return data.data.user;
  },
};
