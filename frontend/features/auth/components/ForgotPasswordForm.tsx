"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Logo } from "@/components/ui/Logo";
import { FormInput } from "@/components/ui/FormInput";
import { forgotPasswordSchema, ForgotPasswordFormValues } from "@/features/auth/schemas/authSchemas";
import { ROUTES } from "@/constants/routes";
import { useToastStore } from "@/stores/toastStore";
import { authService } from "@/services/authService";

/**
 * Form Lupa Password — mengirim link reset ke email.
 *
 * PENTING: form ini SELALU menampilkan pesan sukses yang sama (state `sent`)
 * begitu request ke backend selesai TANPA error jaringan/server, terlepas
 * dari apakah email yang dimasukkan benar-benar terdaftar atau tidak. Backend
 * juga sengaja membalas dengan pesan generik yang sama persis untuk kedua
 * kasus (lihat authController.forgotPassword) — supaya form ini tidak bisa
 * dipakai untuk menebak/mengonfirmasi email mana saja yang terdaftar di
 * sistem (pencegahan enumerasi akun). Frontend TIDAK PERNAH menampilkan
 * pesan seperti "Email tidak ditemukan". `sent` sengaja dikelola manual
 * (bukan memakai `isSubmitSuccessful` dari React Hook Form) supaya perilaku
 * "hanya sukses kalau tidak ada error jaringan" ini eksplisit dan tidak
 * tergantung detail implementasi internal library form.
 */
export function ForgotPasswordForm() {
  const showToast = useToastStore((s) => s.showToast);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: ForgotPasswordFormValues) {
    try {
      await authService.forgotPassword(values);
      setSent(true);
    } catch {
      // Kegagalan jaringan/server (bukan "email tidak ditemukan" — backend tidak
      // pernah mengirim error untuk kasus itu) ditampilkan sebagai toast error
      // biasa. `sent` tetap false supaya user tahu permintaannya belum tentu
      // berhasil dan bisa mencoba lagi.
      showToast("Gagal menghubungi server, silakan coba lagi", "error");
    }
  }

  return (
    <div>
      <div className="mb-8 flex flex-col items-center">
        <Logo className="flex-col text-3xl" />
      </div>

      <h1 className="mb-1 text-2xl font-bold text-neutral-900">Lupa Password</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Masukkan email Anda, kami akan mengirimkan link untuk reset password.
      </p>

      {sent ? (
        <p className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
          Jika email yang Anda masukkan terdaftar pada sistem, kami akan mengirimkan tautan untuk mengatur ulang
          password. Silakan cek email Anda (termasuk folder Spam/Promosi).
        </p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormInput label="Email" type="email" placeholder="Masukkan email anda" {...register("email")} error={errors.email?.message} />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-neutral-900 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-60"
          >
            {isSubmitting ? "Mengirim..." : "KIRIM LINK RESET"}
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
