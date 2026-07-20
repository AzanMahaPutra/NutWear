"use client";

import { useState } from "react";
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
import { getApiErrorMessage } from "@/lib/apiTypes";

/**
 * Form Reset Password — halaman yang dibuka dari link di email Forgot
 * Password (/reset-password?token=...). Token diambil dari query string,
 * bukan dari input yang bisa diedit user, supaya user tidak bisa
 * "menempelkan" token orang lain secara sengaja lewat form (walau secara
 * keamanan backend tetap yang menentukan validitas token, ini murni UX).
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const showToast = useToastStore((s) => s.showToast);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordSchema) });

  async function onSubmit(values: ResetPasswordFormValues) {
    try {
      await authService.resetPassword({ token, ...values });
      setDone(true);
      showToast("Password berhasil diperbarui, silakan login kembali");
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

      {!token ? (
        <p className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
          Link reset password tidak valid. Silakan minta link baru melalui halaman Lupa Password.
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
