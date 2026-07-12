import { SORT_OPTIONS, SortOption } from "@/features/product/types/filter";

interface SortDropdownProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

/**
 * Dropdown sorting reusable — dipakai di halaman Produk (dan bisa dipakai ulang
 * di halaman Kategori atau hasil pencarian).
 */
export function SortDropdown({ value, onChange }: SortDropdownProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as SortOption)}
      className="rounded-full border border-neutral-200 px-4 py-2 text-sm text-neutral-700 outline-none"
    >
      {SORT_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
