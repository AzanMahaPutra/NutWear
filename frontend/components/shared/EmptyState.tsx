import { PackageSearch } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

/**
 * Tampilan kosong reusable — dipakai saat hasil filter/search kosong,
 * cart kosong, wishlist kosong, atau riwayat pesanan kosong.
 */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <PackageSearch className="h-12 w-12 text-neutral-300" />
      <h3 className="text-lg font-semibold text-neutral-800">{title}</h3>
      {description && <p className="max-w-sm text-sm text-neutral-500">{description}</p>}
      {action}
    </div>
  );
}
