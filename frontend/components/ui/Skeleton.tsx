import { cn } from "@/utils/cn";

/**
 * Skeleton block generic — reusable untuk semua state loading (ProductCard, Detail, Cart, dll).
 */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-neutral-200", className)} />;
}

/**
 * Skeleton khusus bentuk ProductCard, dipakai saat grid produk sedang memuat data.
 */
export function ProductCardSkeleton() {
  return (
    <div>
      <Skeleton className="mb-3 aspect-[3/4] w-full rounded-lg" />
      <Skeleton className="mb-2 h-3 w-16" />
      <Skeleton className="mb-2 h-4 w-full" />
      <Skeleton className="h-4 w-20" />
    </div>
  );
}
