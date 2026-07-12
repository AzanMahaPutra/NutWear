import { cn } from "@/utils/cn";

interface StatusToggleProps {
  active: boolean;
  onToggle: () => void;
}

/**
 * Toggle switch aktif/nonaktif reusable — dipakai di tabel Produk, Kategori, Banner.
 */
export function StatusToggle({ active, onToggle }: StatusToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "relative h-6 w-11 rounded-full transition-colors",
        active ? "bg-neutral-900" : "bg-neutral-200"
      )}
      aria-pressed={active}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
          active ? "translate-x-5" : "translate-x-0.5"
        )}
      />
    </button>
  );
}
