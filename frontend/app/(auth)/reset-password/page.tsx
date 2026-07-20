import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";
import { GuestGuard } from "@/components/shared/GuestGuard";

export const metadata: Metadata = {
  title: "Reset Password",
};

export default function ResetPasswordPage() {
  return (
    <GuestGuard>
      {/* Suspense wajib di sini karena ResetPasswordForm memakai useSearchParams
          (baca ?token=... dari URL) — App Router Next.js mengharuskan komponen
          yang memakai useSearchParams dibungkus Suspense boundary. */}
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </GuestGuard>
  );
}
