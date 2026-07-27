"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { ROUTES } from "@/constants/routes";
import { useToastStore } from "@/stores/toastStore";
import { useAuthStore } from "@/stores/authStore";
import { authService } from "@/services/authService";
import { supabaseClient } from "@/lib/supabaseClient";
import { getApiErrorMessage } from "@/lib/apiTypes";

/**
 * UPDATE — Login dengan Google: halaman perantara (ROUTES.authCallback) yang
 * menerima redirect balik dari Google lewat Supabase Auth, lalu menyelesaikan
 * login aplikasi. Alurnya:
 *
 * 1. Tukar `?code=...` (PKCE, default project Supabase baru) jadi session
 *    Supabase — sama seperti flow `?code=...` di ResetPasswordForm.tsx, atau
 *    biarkan `detectSessionInUrl` (flow implicit) yang membaca token dari URL.
 * 2. Kirim access/refresh token sesi tsb ke backend (`authService.loginWithGoogle`)
 *    supaya baris profil disinkronkan & cookie refresh token aplikasi terisi.
 * 3. `supabaseClient.auth.signOut()` — sesi Supabase di browser ini hanya
 *    dipakai sebagai jembatan sesaat untuk mendapatkan token, BUKAN sumber
 *    kebenaran sesi aplikasi (itu tetap authStore + cookie refresh token
 *    backend, sama seperti Login Email & Password) — pola yang sama seperti
 *    ResetPasswordForm.tsx setelah selesai dipakai.
 * 4. Redirect ke Beranda (berhasil) atau Login (gagal, dengan pesan error —
 *    termasuk pesan akun dibanned dari backend).
 */
export function GoogleCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showToast = useToastStore((s) => s.showToast);
  const setUser = useAuthStore((s) => s.setUser);
  const [status, setStatus] = useState<"processing" | "error">("processing");
  const ranOnce = useRef(false);

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;

    async function finishGoogleLogin() {
      try {
        const code = searchParams.get("code");
        if (code) {
          const { error } = await supabaseClient.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        const { data, error: sessionError } = await supabaseClient.auth.getSession();
        if (sessionError || !data.session) {
          throw new Error("Sesi Login Google tidak ditemukan, silakan coba lagi.");
        }

        const user = await authService.loginWithGoogle({
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
        });

        setUser(user);
        showToast("Login dengan Google berhasil");
        router.replace(ROUTES.home);
      } catch (err) {
        setStatus("error");
        showToast(getApiErrorMessage(err, "Login dengan Google gagal, silakan coba lagi"), "error");
        router.replace(ROUTES.login);
      } finally {
        // Sesi Supabase di browser ini hanya jembatan sesaat (lihat komentar di atas),
        // selalu dibersihkan baik berhasil maupun gagal supaya tidak tertinggal.
        await supabaseClient.auth.signOut().catch(() => {});
      }
    }

    finishGoogleLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-4">
      <Logo className="flex-col text-3xl" />
      <p className="text-sm text-neutral-500">
        {status === "processing" ? "Menyelesaikan Login dengan Google..." : "Mengarahkan kembali ke halaman Login..."}
      </p>
    </div>
  );
}
