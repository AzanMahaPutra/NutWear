import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { GuestGuard } from "@/components/shared/GuestGuard";

export const metadata: Metadata = {
  title: "Masuk",
};

export default function LoginPage() {
  return (
    <GuestGuard>
      <LoginForm />
    </GuestGuard>
  );
}
