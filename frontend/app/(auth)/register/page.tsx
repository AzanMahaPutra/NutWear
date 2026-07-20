import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { GuestGuard } from "@/components/shared/GuestGuard";

export const metadata: Metadata = {
  title: "Daftar Akun",
};

export default function RegisterPage() {
  return (
    <GuestGuard>
      <RegisterForm />
    </GuestGuard>
  );
}
