import type { Metadata } from "next";
import { CartView } from "@/features/cart/components/CartView";
import { AuthGuard } from "@/components/shared/AuthGuard";

export const metadata: Metadata = {
  title: "Keranjang Belanja",
};

export default function KeranjangPage() {
  return (
    <AuthGuard>
      <CartView />
    </AuthGuard>
  );
}
