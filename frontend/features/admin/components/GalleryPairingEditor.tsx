"use client";

import { useEffect, useState } from "react";
import { Search, Shirt, Trash2, X } from "lucide-react";
import { productService, PairedProductDetail } from "@/services/productService";
import { Product } from "@/types/product";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useToastStore } from "@/stores/toastStore";
import { getApiErrorMessage } from "@/lib/apiTypes";
import { formatCurrency } from "@/utils/formatCurrency";

interface GalleryPairingEditorProps {
  imageId: string;
  /** Produk yang sedang diedit — dipakai supaya tidak muncul di hasil pencarian (tidak bisa memasangkan produk dengan dirinya sendiri). */
  currentProductId: string;
  initialHasPairs: boolean;
  onCountChange: (imageId: string, count: number) => void;
}

/**
 * UPDATE 3 — Pengaturan Pasangan Produk per foto Gallery.
 * Dropdown searchable (ambil daftar produk langsung dari database lewat
 * productService.getAll) untuk menambah satu/lebih produk pasangan pada
 * foto ini, plus daftar pasangan yang sudah ada dengan opsi hapus/ganti.
 */
export function GalleryPairingEditor({ imageId, currentProductId, initialHasPairs, onCountChange }: GalleryPairingEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pairs, setPairs] = useState<PairedProductDetail[]>([]);
  const [localCount, setLocalCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const debouncedQuery = useDebouncedValue(query, 350);
  const showToast = useToastStore((s) => s.showToast);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    productService
      .getImagePairs(imageId)
      .then((data) => {
        setPairs(data);
        setLocalCount(data.length);
      })
      .catch(() => setPairs([]))
      .finally(() => setIsLoading(false));
  }, [isOpen, imageId]);

  useEffect(() => {
    if (!isOpen || debouncedQuery.trim().length < 2) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    productService
      .getAll({ search: debouncedQuery.trim(), pageSize: 8 })
      .then(({ items }) => setResults(items.filter((p) => p.id !== currentProductId)))
      .catch(() => setResults([]))
      .finally(() => setIsSearching(false));
  }, [isOpen, debouncedQuery, currentProductId]);

  async function handleAdd(productId: string) {
    setAddingId(productId);
    try {
      const updated = await productService.addImagePair(imageId, productId);
      setPairs(updated);
      setLocalCount(updated.length);
      onCountChange(imageId, updated.length);
      setQuery("");
      setResults([]);
      showToast("Pasangan produk berhasil ditambahkan");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    } finally {
      setAddingId(null);
    }
  }

  async function handleRemove(pairedProductId: string) {
    try {
      const updated = await productService.removeImagePair(imageId, pairedProductId);
      setPairs(updated);
      setLocalCount(updated.length);
      onCountChange(imageId, updated.length);
      showToast("Pasangan produk dihapus");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  }

  return (
    <div className="rounded-md border border-neutral-200">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-semibold text-neutral-700"
      >
        <span className="flex items-center gap-1.5">
          <Shirt className="h-3.5 w-3.5" /> Pasangan Produk
          {!isOpen && (localCount ?? (initialHasPairs ? 1 : 0)) > 0 && (
            <span className="ml-1 rounded-full bg-neutral-900 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {localCount ?? "•"}
            </span>
          )}
        </span>
        <span className="text-neutral-400">{isOpen ? "Tutup" : "Atur"}</span>
      </button>

      {isOpen && (
        <div className="space-y-3 border-t border-neutral-100 p-3">
          {isLoading ? (
            <p className="text-xs text-neutral-400">Memuat pasangan produk...</p>
          ) : (
            <>
              {pairs.length > 0 ? (
                <div className="space-y-1.5">
                  {pairs.map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-2 rounded-md bg-neutral-50 px-2.5 py-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        {p.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.imageUrl} alt={p.namaProduk} className="h-8 w-8 rounded-md object-cover" />
                        )}
                        <div>
                          <p className="font-medium text-neutral-800">{p.namaProduk}</p>
                          <p className="text-neutral-500">
                            {formatCurrency(p.harga)}
                            {p.warna ? ` · ${p.warna}` : ""}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemove(p.id)}
                        aria-label={`Hapus pasangan ${p.namaProduk}`}
                        className="rounded-md border border-red-200 p-1 text-red-500 hover:bg-white"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-neutral-400">Belum ada pasangan produk untuk foto ini.</p>
              )}

              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari produk untuk dipasangkan..."
                  className="w-full rounded-md border border-neutral-200 py-2 pl-8 pr-7 text-xs outline-none focus:border-neutral-900"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Bersihkan pencarian"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}

                {query.trim().length >= 2 && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border border-neutral-200 bg-white shadow-lg">
                    {isSearching ? (
                      <p className="px-3 py-2 text-xs text-neutral-400">Mencari...</p>
                    ) : results.length > 0 ? (
                      <ul className="max-h-56 overflow-y-auto">
                        {results
                          .filter((r) => !pairs.some((p) => p.id === r.id))
                          .map((r) => (
                            <li key={r.id}>
                              <button
                                type="button"
                                disabled={addingId === r.id}
                                onClick={() => handleAdd(r.id)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-neutral-50 disabled:opacity-60"
                              >
                                {r.images[0] && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={r.images[0].imageUrl} alt={r.namaProduk} className="h-7 w-7 rounded object-cover" />
                                )}
                                <span className="flex-1">
                                  <span className="block font-medium text-neutral-800">{r.namaProduk}</span>
                                  <span className="text-neutral-500">{formatCurrency(r.harga)}</span>
                                </span>
                              </button>
                            </li>
                          ))}
                      </ul>
                    ) : (
                      <p className="px-3 py-2 text-xs text-neutral-400">Produk tidak ditemukan.</p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
