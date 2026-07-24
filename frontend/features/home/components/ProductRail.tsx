import { Container } from "@/components/ui/Container";
import { ProductCard } from "@/components/shared/ProductCard";
import { ProductSlider } from "@/features/home/components/ProductSlider";
import { Product } from "@/types/product";

interface ProductRailProps {
  title: string;
  products: Product[];
}

/** Ambang jumlah produk sebelum section berubah dari grid statis menjadi slider. */
const SLIDER_THRESHOLD = 4;

/**
 * Menampilkan daftar produk dengan judul section.
 * Reusable untuk Produk Terbaru, Produk Terlaris, Produk Rekomendasi di Beranda.
 *
 * - Jumlah produk <= 4: tetap grid statis seperti sebelumnya (tidak berubah).
 * - Jumlah produk > 4: berubah jadi slider/carousel horizontal (`ProductSlider`)
 *   supaya tidak turun ke baris kedua (wrap).
 */
export function ProductRail({ title, products }: ProductRailProps) {
  if (products.length === 0) return null;

  return (
    <Container className="py-10">
      <h2 className="mb-6 text-2xl font-bold text-neutral-900">{title}</h2>
      {products.length > SLIDER_THRESHOLD ? (
        <ProductSlider products={products} />
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </Container>
  );
}
