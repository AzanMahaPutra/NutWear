import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { CategoryGrid } from "@/features/home/components/CategoryGrid";
import { ProductShopView } from "@/features/product/components/ProductShopView";
import { productService } from "@/services/productService";
import { categoryService } from "@/services/categoryService";

export const metadata: Metadata = {
  title: "Produk",
  description: "Jelajahi seluruh koleksi produk NutWear dengan filter kategori, ukuran, warna, dan harga.",
};

interface ProdukPageProps {
  searchParams: Promise<{ search?: string; kategori?: string; newArrival?: string }>;
}

export default async function ProdukPage({ searchParams }: ProdukPageProps) {
  const { search, kategori, newArrival } = await searchParams;

  const [{ items: products }, categories] = await Promise.all([
    productService.getAll({ pageSize: 100, search }),
    categoryService.getAll().catch(() => []),
  ]);

  return (
    <>
      <CategoryGrid />
      <Container className="pb-2 pt-2">
        <ProductShopView
          products={products}
          categories={categories}
          initialSearch={search ?? ""}
          initialKategoriId={kategori}
          initialNewArrival={newArrival === "1"}
        />
      </Container>
    </>
  );
}
