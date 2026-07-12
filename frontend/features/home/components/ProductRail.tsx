import { Container } from "@/components/ui/Container";
import { ProductCard } from "@/components/shared/ProductCard";
import { Product } from "@/types/product";

interface ProductRailProps {
  title: string;
  products: Product[];
}

/**
 * Menampilkan daftar produk dalam grid dengan judul section.
 * Reusable untuk Produk Terbaru, Produk Terlaris, Produk Rekomendasi di Beranda.
 */
export function ProductRail({ title, products }: ProductRailProps) {
  if (products.length === 0) return null;

  return (
    <Container className="py-10">
      <h2 className="mb-6 text-2xl font-bold text-neutral-900">{title}</h2>
      <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </Container>
  );
}
