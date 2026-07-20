"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Logo } from "@/components/ui/Logo";
import { FormInput } from "@/components/ui/FormInput";
import { resetPasswordSchema, ResetPasswordFormValues } from "@/features/auth/schemas/authSchemas";
import { ROUTES } from "@/constants/routes";
import { useToastStore } from "@/stores/toastStore";
import { authService } from "@/services/authService";
import { supabaseClient } from "@/lib/supabaseClient";
import { getApiErrorMessage } from "@/lib/apiTypes";

type LinkStatus = "checking" | "valid" | "invalid";

/**
 * Form Reset Password — halaman yang dibuka dari link di email Forgot
 * Password yang dikirim Supabase Auth (/reset-password?code=...).
 *
 * BEDA dari alur lama: tidak ada lagi `?token=...` custom. Supabase Auth
 * mengirim salah satu dari dua bentuk link tergantung flow yang aktif di
 * project (lihat Supabase Dashboard → Authentication → URL Configuration):
 *   - PKCE (default project baru): `?code=...` di query string — ditukar
 *     jadi session lewat `exchangeCodeForSession`.
 *   - Implicit (project lama): `#access_token=...&type=recovery` di URL
 *     fragment — otomatis dibaca oleh supabaseClient (detectSessionInUrl).
 * Form ini menangani KEDUANYA supaya tidak bergantung pada setting project
 * tertentu. Begitu session recovery valid didapat, password baru diganti
 * lewat `authService.resetPassword` (yang di baliknya memanggil
 * `supabase.auth.updateUser`).
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showToast = useToastStore((s) => s.showToast);
  const [linkStatus, setLinkStatus] = useState<LinkStatus>("checking");
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordSchema) });

  useEffect(() => {
    let active = true;

    async function verifyRecoveryLink() {
      const code = searchParams.get("code");

      // Flow PKCE — link membawa `?code=...`, harus ditukar jadi session dulu.
      if (code) {
        const { error } = await supabaseClient.auth.exchangeCodeForSession(code);
        if (active) setLinkStatus(error ? "invalid" : "valid");
        return;
      }

      // Flow implicit — supabaseClient sudah otomatis membaca token dari URL
      // fragment saat inisialisasi (detectSessionInUrl: true). Di sini tinggal
      // dicek apakah sesi tersebut benar-benar berhasil terbentuk.
      const { data } = await supabaseClient.auth.getSession();
      if (active) setLinkStatus(data.session ? "valid" : "invalid");
    }

    verifyRecoveryLink();

    // Jaring pengaman tambahan: Supabase memancarkan event PASSWORD_RECOVERY
    // begitu sesi recovery terbentuk, kadang sedikit lebih lambat dari
    // pengecekan di atas (mis. saat token masih diproses dari URL fragment).
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" && session) {
        setLinkStatus("valid");
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(values: ResetPasswordFormValues) {
    try {
      await authService.resetPassword({ password: values.password });
      setDone(true);
      showToast("Password berhasil diperbarui, silakan login kembali");
      // Sesi recovery sementara ini bukan sesi login penuh aplikasi (login
      // aplikasi tetap lewat authStore/apiClient) — keluarkan supaya tidak
      // tertinggal di browser setelah selesai.
      await supabaseClient.auth.signOut();
      router.push(ROUTES.login);
    } catch (err) {
      showToast(getApiErrorMessage(err, "Gagal mereset password, silakan coba lagi"), "error");
    }
  }

  return (
    <div>
      <div className="mb-8 flex flex-col items-center">
        <Logo className="flex-col text-3xl" />
      </div>

      <h1 className="mb-1 text-2xl font-bold text-neutral-900">Reset Password</h1>
      <p className="mb-6 text-sm text-neutral-500">Masukkan password baru untuk akun Anda.</p>

      {linkStatus === "checking" ? (
        <p className="rounded-lg bg-neutral-50 p-4 text-sm text-neutral-500">Memeriksa link reset password...</p>
      ) : linkStatus === "invalid" ? (
        <p className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
          Link reset password tidak valid atau sudah kedaluwarsa. Silakan minta link baru melalui halaman Lupa
          Password.
        </p>
      ) : done ? (
        <p className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
          Password berhasil diperbarui. Mengarahkan ke halaman Masuk...
        </p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormInput
            label="Password Baru"
            type="password"
            placeholder="Masukkan password baru"
            {...register("password")}
            error={errors.password?.message}
          />
          <FormInput
            label="Konfirmasi Password"
            type="password"
            placeholder="Ulangi password baru"
            {...register("confirmPassword")}
            error={errors.confirmPassword?.message}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-neutral-900 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-60"
          >
            {isSubmitting ? "Memproses..." : "RESET PASSWORD"}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-neutral-500">
        Ingat password Anda?{" "}
        <Link href={ROUTES.login} className="font-semibold text-neutral-900 underline">
          Masuk
        </Link>
      </p>
    </div>
  );
}
