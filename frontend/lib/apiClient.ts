import axios from "axios";

/**
 * Instance Axios tunggal untuk seluruh aplikasi (reusable service layer).
 * - withCredentials: true supaya cookie httpOnly refresh token ikut terkirim.
 * - accessToken disimpan in-memory (bukan localStorage) untuk mengurangi risiko XSS,
 *   dan di-refresh otomatis lewat endpoint /auth/refresh saat 401.
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

let accessToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

/** Dipanggil AuthProvider untuk membersihkan state user saat refresh token gagal (benar-benar logout). */
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true })
      .then((res) => {
        const newToken = res.data?.data?.accessToken as string;
        setAccessToken(newToken);
        return newToken;
      })
      .catch(() => {
        setAccessToken(null);
        onUnauthorized?.();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const isAuthEndpoint = originalRequest?.url?.includes("/auth/");

    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

export { refreshAccessToken };
