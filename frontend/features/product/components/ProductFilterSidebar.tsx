import { FilterCheckboxGroup } from "@/components/shared/FilterCheckboxGroup";
import { AVAILABLE_SIZES, ProductFilterState } from "@/features/product/types/filter";
import { ProductColor, Category } from "@/types/product";

interface ProductFilterSidebarProps {
  filter: ProductFilterState;
  categories: Category[];
  availableColors: ProductColor[];
  onToggleKategori: (id: string) => void;
  onToggleUkuran: (value: string) => void;
  onToggleWarna: (value: string) => void;
  onToggleNewArrival: () => void;
  onReset: () => void;
}

/**
 * Sidebar filter halaman Produk: Kategori, Ukuran, Warna, New Arrival.
 * Dipisah dari page.tsx supaya reusable & mudah diuji sendiri.
 */
export function ProductFilterSidebar({
  filter,
  categories,
  availableColors,
  onToggleKategori,
  onToggleUkuran,
  onToggleWarna,
  onToggleNewArrival,
  onReset,
}: ProductFilterSidebarProps) {
  return (
    <aside className="w-full shrink-0 lg:w-64">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-bold text-neutral-900">Filter</h3>
        <button type="button" onClick={onReset} className="text-xs font-medium text-neutral-500 hover:text-neutral-900">
          Reset
        </button>
      </div>

      <FilterCheckboxGroup
        title="Status"
        options={[{ value: "new_arrival", label: "New Arrival" }]}
        selected={filter.newArrival ? ["new_arrival"] : []}
        onChange={onToggleNewArrival}
      />

      <FilterCheckboxGroup
        title="Kategori"
        options={categories.map((c) => ({ value: c.id, label: c.namaKategori }))}
        selected={filter.kategoriIds}
        onChange={onToggleKategori}
      />

      <FilterCheckboxGroup
        title="Ukuran"
        options={AVAILABLE_SIZES.map((s) => ({ value: s, label: s }))}
        selected={filter.ukuran}
        onChange={onToggleUkuran}
      />

      <FilterCheckboxGroup
        title="Warna"
        options={availableColors.map((c) => ({ value: c.code, label: c.code, swatch: c.hex }))}
        selected={filter.warna}
        onChange={onToggleWarna}
      />
    </aside>
  );
}
