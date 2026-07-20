"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { FormInput } from "@/components/ui/FormInput";
import { registerSchema, RegisterFormValues } from "@/features/auth/schemas/authSchemas";
import { ROUTES } from "@/constants/routes";
import { useToastStore } from "@/stores/toastStore";
import { authService } from "@/services/authService";
import { getApiErrorMessage } from "@/lib/apiTypes";

/**
 * Form Register. Reuse pola yang sama dengan LoginForm (RHF + Zod).
 */
export function RegisterForm() {
  const router = useRouter();
  const showToast = useToastStore((s) => s.showToast);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterFormValues) {
    try {
      await authService.register(values);
      showToast("Akun berhasil dibuat, silakan masuk");
      router.push(ROUTES.login);
    } catch (err) {
      showToast(getApiErrorMessage(err, "Registrasi gagal, coba lagi"), "error");
    }
  }

  return (
    <div>
      <Link
        href={ROUTES.home}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Beranda
      </Link>

      <div className="mb-8 flex flex-col items-center">
        <Logo className="flex-col text-3xl" />
      </div>

      <h1 className="mb-1 text-2xl font-bold text-neutral-900">Daftar Akun</h1>
      <p className="mb-6 text-sm text-neutral-500">Buat akun baru untuk mulai berbelanja</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormInput label="Nama" placeholder="Nama lengkap" {...register("namaLengkap")} error={errors.namaLengkap?.message} />
        <FormInput label="Email" type="email" placeholder="Masukkan email anda" {...register("email")} error={errors.email?.message} />
        <FormInput label="No. HP" type="tel" placeholder="08xxxxxxxxxx" {...register("noHp")} error={errors.noHp?.message} />
        <FormInput
          label="Password"
          type="password"
          placeholder="Masukkan password anda"
          {...register("password")}
          error={errors.password?.message}
        />
        <FormInput
          label="Konfirmasi"
          type="password"
          placeholder="Ulangi password anda"
          {...register("confirmPassword")}
          error={errors.confirmPassword?.message}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-neutral-900 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-60"
        >
          {isSubmitting ? "Memproses..." : "DAFTAR"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        Sudah punya akun?{" "}
        <Link href={ROUTES.login} className="font-semibold text-neutral-900 underline">
          Masuk
        </Link>
      </p>
    </div>
  );
}
