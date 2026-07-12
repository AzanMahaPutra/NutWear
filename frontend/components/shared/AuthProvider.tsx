"use client";

import { useEffect } from "react";
import { refreshAccessToken, setUnauthorizedHandler } from "@/lib/apiClient";
import { useAuthStore } from "@/stores/authStore";
import { userService } from "@/services/userService";

/**
 * Dipasang sekali di RootLayout. Saat aplikasi dimuat (refresh halaman, buka tab baru),
 * mencoba menukar httpOnly refresh token cookie menjadi access token baru secara diam-diam,
 * supaya user tidak perlu login ulang setiap refresh halaman.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setInitializing = useAuthStore((s) => s.setInitializing);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));

    (async () => {
      const token = await refreshAccessToken();
      if (token) {
        try {
          const profile = await userService.getProfile();
          setUser(profile);
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setInitializing(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
