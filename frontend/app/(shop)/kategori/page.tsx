import type { Metadata } from "next";
import { CategoryGrid } from "@/features/home/components/CategoryGrid";

export const metadata: Metadata = { title: "Kategori" };

export default function KategoriIndexPage() {
  return <CategoryGrid />;
}
