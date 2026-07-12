import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/LoginForm";

export const metadata: Metadata = {
  title: "Masuk",
};

export default function LoginPage() {
  return <LoginForm />;
}
