import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { SupportView } from "@/features/support/components/SupportView";

export const metadata: Metadata = {
  title: "Pelayanan & Dukungan",
  description: "FAQ, Hubungi Kami, Kebijakan Pengembalian, Panduan Ukuran, dan Syarat & Ketentuan NutWear.",
};

export default function PelayananDukunganPage() {
  return (
    <Container className="py-10">
      <h1 className="mb-8 text-center text-3xl font-bold text-neutral-900">Pelayanan &amp; Dukungan</h1>
      <SupportView />
    </Container>
  );
}
