import { Container } from "@/components/ui/Container";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";

/**
 * Loading UI global Next.js (app/loading.tsx) — otomatis ditampilkan
 * saat navigasi antar-route yang butuh data server component.
 */
export default function Loading() {
  return (
    <Container className="py-10">
      <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </Container>
  );
}
