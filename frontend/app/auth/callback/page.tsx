import type { Metadata } from "next";
import { Suspense } from "react";
import { GoogleCallbackHandler } from "@/features/auth/components/GoogleCallbackHandler";

export const metadata: Metadata = {
  title: "Memproses Login...",
};

// UPDATE — Login dengan Google: halaman redirect target OAuth (lihat
// frontend/services/authService.ts -> signInWithGoogle & GoogleCallbackHandler.tsx).
// Sengaja BUKAN bagian dari route group `(auth)` (yang dibungkus GuestGuard) —
// halaman ini justru harus tetap bisa diakses persis pada momen user BARU SAJA
// berhasil login, bukan sebelum login.
export default function GoogleAuthCallbackPage() {
  return (
    // Suspense wajib karena GoogleCallbackHandler memakai useSearchParams (baca
    // ?code=... dari URL) — sama seperti ResetPasswordForm.tsx.
    <Suspense fallback={null}>
      <GoogleCallbackHandler />
    </Suspense>
  );
}
