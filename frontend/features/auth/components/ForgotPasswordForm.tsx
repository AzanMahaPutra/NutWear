"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Logo } from "@/components/ui/Logo";
import { FormInput } from "@/components/ui/FormInput";
import { forgotPasswordSchema, ForgotPasswordFormValues } from "@/features/auth/schemas/authSchemas";
import { ROUTES } from "@/constants/routes";
import { useToastStore } from "@/stores/toastStore";

/**
 * Form Lupa Password — mengirim link reset ke email (dummy di Fase 1).
 */
export function ForgotPasswordForm() {
  const showToast = useToastStore((s) => s.showToast);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: ForgotPasswordFormValues) {
    // TODO Fase 3: ganti dengan authService.forgotPassword(values)
    console.log("forgot password submit", values);
    showToast("Link reset password telah dikirim (dummy)");
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

      {isSubmitSuccessful ? (
        <p className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
          Silakan cek email Anda untuk melanjutkan proses reset password.
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
