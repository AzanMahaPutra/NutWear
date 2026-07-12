import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderHistoryView } from "@/features/order/components/OrderHistoryView";

export const metadata: Metadata = {
  title: "Riwayat Pesanan",
};

export default function RiwayatPesananPage() {
  return (
    <Suspense fallback={null}>
      <OrderHistoryView />
    </Suspense>
  );
}
