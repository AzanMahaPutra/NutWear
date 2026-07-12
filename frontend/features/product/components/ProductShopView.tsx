"use client";

import { useMemo, useState } from "react";
import { Container } from "@/components/ui/Container";
import { ProductCard } from "@/components/shared/ProductCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { ProductFilterSidebar } from "@/features/product/components/ProductFilterSidebar";
import { SortDropdown } from "@/features/product/components/SortDropdown";
import { useFilteredProducts } from "@/features/product/hooks/useFilteredProducts";
import { DEFAULT_FILTER_STATE } from "@/features/product/types/filter";
import { Product, ProductColor, Category } from "@/types/product";
import { enrichProduct } from "@/utils/enrichProduct";

const PAGE_SIZE = 8;

interface ProductShopViewProps {
  products: Product[];
  categories: Category[];
  isLoading?: boolean;
  initialSearch?: string;
  /** ID kategori yang langsung aktif difilter, contoh: dari Footer/CategoryGrid ke halaman Produk. */
  initialKategoriId?: string;
  /** true = filter New Arrival langsung aktif saat halaman Produk dibuka. */
  initialNewArrival?: boolean;
}

function toggleInArray(arr: string[], value: string) {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

/**
 * View utama halaman Produk (Shop): filter sidebar, sort, grid produk, pagination.
 * Client component reusable — data produk & kategori diambil oleh Server Component
 * pemanggil (page.tsx) lalu diteruskan sebagai props (data sudah dari API sungguhan).
 */
export function ProductShopView({
  products,
  categories,
  isLoading = false,
  initialSearch = "",
  initialKategoriId,
  initialNewArrival = false,
}: ProductShopViewProps) {
  const [filter, setFilter] = useState({
    ...DEFAULT_FILTER_STATE,
    search: initialSearch,
    kategoriIds: initialKategoriId ? [initialKategoriId] : DEFAULT_FILTER_STATE.kategoriIds,
    newArrival: initialNewArrival,
  });
  const [page, setPage] = useState(1);

  const availableColors: ProductColor[] = useMemo(() => {
    const map = new Map<string, ProductColor>();
    products.forEach((p) => enrichProduct(p).colors?.forEach((c) => map.set(c.code, c)));
    return Array.from(map.values());
  }, [products]);

  const filtered = useFilteredProducts(products, filter);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function updateFilter<K extends keyof typeof filter>(key: K, value: (typeof filter)[K]) {
    setFilter((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }

  return (
    <>
      <Container className="flex flex-col gap-8 pb-16 lg:flex-row">
        <ProductFilterSidebar
          filter={filter}
          categories={categories}
          availableColors={availableColors}
          onToggleKategori={(id) => updateFilter("kategoriIds", toggleInArray(filter.kategoriIds, id))}
          onToggleUkuran={(v) => updateFilter("ukuran", toggleInArray(filter.ukuran, v))}
          onToggleWarna={(v) => updateFilter("warna", toggleInArray(filter.warna, v))}
          onToggleNewArrival={() => updateFilter("newArrival", !filter.newArrival)}
          onReset={() => setFilter(DEFAULT_FILTER_STATE)}
        />

        <div className="flex-1">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-neutral-500">{filtered.length} produk ditemukan</p>
            <SortDropdown value={filter.sort} onChange={(v) => updateFilter("sort", v)} />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : paginated.length === 0 ? (
            <EmptyState
              title="Produk tidak ditemukan"
              description="Coba ubah filter atau kata kunci pencarian Anda."
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
                {paginated.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </div>
      </Container>
    </>
  );
}
