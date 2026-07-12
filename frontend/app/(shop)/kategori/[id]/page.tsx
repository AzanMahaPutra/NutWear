import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { ProductShopView } from "@/features/product/components/ProductShopView";
import { productService } from "@/services/productService";
import { categoryService } from "@/services/categoryService";

interface KategoriDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: KategoriDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const categories = await categoryService.getAll().catch(() => []);
  const category = categories.find((c) => c.id === id);
  return { title: category?.namaKategori ?? "Kategori" };
}

/**
 * Halaman Kategori Detail — reuse ProductShopView yang sama dengan halaman Produk,
 * hanya scoped ke satu kategori (filter categoryId dikirim langsung ke Product API).
 */
export default async function KategoriDetailPage({ params }: KategoriDetailPageProps) {
  const { id } = await params;
  const categories = await categoryService.getAll().catch(() => []);
  const category = categories.find((c) => c.id === id);
  if (!category) notFound();

  const { items: products } = await productService.getAll({ categoryId: id, pageSize: 100 });

  return (
    <Container className="pt-8">
      <h1 className="mb-6 text-center text-3xl font-bold text-neutral-900">{category.namaKategori}</h1>
      <ProductShopView products={products} categories={categories} />
    </Container>
  );
}
