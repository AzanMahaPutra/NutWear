import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase khusus browser — dipakai HANYA oleh alur Reset Password
 * (features/auth/components/ResetPasswordForm.tsx).
 *
 * Kenapa reset password butuh client Supabase langsung di frontend (bukan
 * lewat backend seperti fitur lain)? Karena saat user membuka link dari email
 * Supabase Auth, session recovery-nya dikirim lewat URL (query param `code`
 * untuk PKCE flow, atau fragment `#access_token=...` untuk implicit flow) —
 * dan itu HANYA bisa dibaca oleh browser, tidak pernah sampai ke server. Jadi
 * penggantian password ("supabase.auth.updateUser") wajib dipanggil dari sini,
 * bukan dari backend. Ini persis alur resmi yang direkomendasikan dokumentasi
 * Supabase Auth untuk Reset Password di aplikasi Next.js.
 *
 * `NEXT_PUBLIC_SUPABASE_ANON_KEY` aman dipakai di browser — anon key memang
 * didesain untuk publik, berbeda dari Service Role Key (yang HANYA boleh ada
 * di backend, lihat backend/src/config/supabase.js).
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    "[supabaseClient] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY belum diset. " +
      "Halaman Reset Password tidak akan berfungsi tanpa ini."
  );
}

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Membaca otomatis access_token/refresh_token dari URL saat user datang
    // dari link email Supabase Auth (implicit flow).
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
});
