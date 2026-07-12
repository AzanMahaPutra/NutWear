import type { Metadata } from "next";
import { CheckoutView } from "@/features/checkout/components/CheckoutView";
import { AuthGuard } from "@/components/shared/AuthGuard";

export const metadata: Metadata = {
  title: "Checkout",
};

export default function CheckoutPage() {
  return (
    <AuthGuard>
      <CheckoutView />
    </AuthGuard>
  );
}
