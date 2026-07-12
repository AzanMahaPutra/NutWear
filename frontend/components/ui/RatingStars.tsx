import { Star } from "lucide-react";
import { cn } from "@/utils/cn";

interface RatingStarsProps {
  rating: number;
  reviewCount?: number;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Menampilkan rating bintang + jumlah ulasan.
 * Reusable di ProductCard, Detail Produk, dan halaman Ulasan.
 */
export function RatingStars({ rating, reviewCount, size = "sm", className }: RatingStarsProps) {
  const starSize = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              starSize,
              i < Math.round(rating) ? "fill-neutral-900 text-neutral-900" : "fill-neutral-200 text-neutral-200"
            )}
          />
        ))}
      </div>
      <span className="text-xs font-medium text-neutral-700">{rating.toFixed(1)}</span>
      {typeof reviewCount === "number" && (
        <span className="text-xs text-neutral-400">
          ({reviewCount > 999 ? "999+" : reviewCount})
        </span>
      )}
    </div>
  );
}
