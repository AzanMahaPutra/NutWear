import type { Metadata } from "next";
import { AdminTopbar } from "@/features/admin/components/AdminTopbar";
import { InventoryStockView } from "@/features/admin/components/InventoryStockView";

export const metadata: Metadata = { title: "Inventory Stock" };

export default function AdminInventoryStokPage() {
  return (
    <>
      <AdminTopbar title="Inventory Stock" />
      <InventoryStockView />
    </>
  );
}
