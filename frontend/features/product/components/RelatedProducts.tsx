import { Container } from "@/components/ui/Container";
import { ProductCard } from "@/components/shared/ProductCard";
import { Product } from "@/types/product";

/**
 * Section Related Product di bawah Detail Produk, dipakai ulang untuk produk sejenis.
 */
export function RelatedProducts({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  return (
    <Container className="py-14">
      <h2 className="mb-6 text-xl font-bold text-neutral-900">Related Product</h2>
      <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </Container>
  );
}
