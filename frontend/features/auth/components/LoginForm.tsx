"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { FormInput } from "@/components/ui/FormInput";
import { loginSchema, LoginFormValues } from "@/features/auth/schemas/authSchemas";
import { ROUTES } from "@/constants/routes";
import { useToastStore } from "@/stores/toastStore";
import { useAuthStore } from "@/stores/authStore";
import { authService } from "@/services/authService";
import { getApiErrorMessage } from "@/lib/apiTypes";

/**
 * Form Login. Validasi pakai React Hook Form + Zod.
 * Fase 1: submit hanya simulasi (belum memanggil Auth API sungguhan).
 */
export function LoginForm() {
  const router = useRouter();
  const showToast = useToastStore((s) => s.showToast);
  const setUser = useAuthStore((s) => s.setUser);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginFormValues) {
    try {
      const user = await authService.login(values);
      setUser(user);
      showToast("Login berhasil");
      router.push(ROUTES.home);
    } catch (err) {
      showToast(getApiErrorMessage(err, "Email atau password salah"), "error");
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

      <h1 className="mb-1 text-2xl font-bold text-neutral-900">Masuk</h1>
      <p className="mb-6 text-sm text-neutral-500">Masuk atau buat akun</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormInput label="Email" type="email" placeholder="Masukkan email anda" {...register("email")} error={errors.email?.message} />
        <FormInput
          label="Password"
          type="password"
          placeholder="Masukkan password anda"
          {...register("password")}
          error={errors.password?.message}
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-neutral-600">
            <input type="checkbox" defaultChecked className="h-4 w-4 accent-neutral-900" />
            Kirimi saya email berita dan penawaran
          </label>
          <Link href={ROUTES.forgotPassword} className="font-medium text-neutral-900 underline">
            Lupa password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-neutral-900 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-60"
        >
          {isSubmitting ? "Memproses..." : "MASUK"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        Belum punya akun?{" "}
        <Link href={ROUTES.register} className="font-semibold text-neutral-900 underline">
          Daftar
        </Link>
      </p>
    </div>
  );
}
