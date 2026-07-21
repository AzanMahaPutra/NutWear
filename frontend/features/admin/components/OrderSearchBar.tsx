"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import { OrderStatusBadge } from "@/components/shared/OrderStatusBadge";
import { orderService, OrderSearchSuggestion } from "@/services/orderService";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatDate } from "@/utils/formatDate";

interface OrderSearchBarProps {
  /** Dipanggil dengan kata kunci yang sudah di-debounce — dipakai parent sebagai filter `search`. */
  onSearch: (term: string) => void;
  /** Naikkan angka ini dari parent (mis. tombol "Reset Filter") untuk mengosongkan input ini. */
  resetSignal?: number;
}

/**
 * UPDATE — Search Order ID: Search Bar + dropdown autocomplete di bagian atas halaman
 * Pesanan Admin. Mendukung pencarian manual (sebagian/seluruh Order ID, real-time
 * dengan debounce) maupun memilih langsung dari dropdown saran.
 *
 * Pencarian & saran autocomplete SELALU diambil dari backend (bukan filter di
 * frontend) — lihat orderService.getAllOrders (param `search`) dan
 * orderService.searchSuggestions — supaya tetap cepat walau jumlah pesanan
 * sudah sangat banyak.
 */
export function OrderSearchBar({ onSearch, resetSignal }: OrderSearchBarProps) {
  const [value, setValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<OrderSearchSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedValue = useDebouncedValue(value, 300);

  // Kirim kata kunci (sudah di-debounce) ke parent supaya tabel pesanan ikut
  // terfilter secara real-time, tanpa perlu tombol Search.
  useEffect(() => {
    onSearch(debouncedValue.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue]);

  // Ambil saran autocomplete dari backend setiap kata kunci (yang sudah di-debounce) berubah.
  useEffect(() => {
    const term = debouncedValue.trim();
    if (!term) {
      setSuggestions([]);
      setIsLoadingSuggestions(false);
      return;
    }

    let cancelled = false;
    setIsLoadingSuggestions(true);
    orderService
      .searchSuggestions(term)
      .then((result) => {
        if (!cancelled) setSuggestions(result);
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSuggestions(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedValue]);

  // Reset dari parent (mis. tombol "Reset Filter").
  useEffect(() => {
    if (resetSignal === undefined) return;
    setValue("");
    setSuggestions([]);
    setIsOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

  // Tutup dropdown apabila Admin mengklik area di luar Search Bar.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleChange(next: string) {
    setValue(next);
    setIsOpen(Boolean(next));
  }

  function handleSelect(suggestion: OrderSearchSuggestion) {
    const shortId = suggestion.id.slice(0, 8).toUpperCase();
    setValue(shortId);
    setIsOpen(false);
    setSuggestions([]);
    // Langsung kirim ke parent (tidak menunggu debounce) supaya tabel pesanan
    // langsung menampilkan transaksi yang dipilih.
    onSearch(shortId);
  }

  function handleClear() {
    setValue("");
    setSuggestions([]);
    setIsOpen(false);
    onSearch("");
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setIsOpen(false);
    }
  }

  const showDropdown = isOpen && Boolean(value) && (isLoadingSuggestions || suggestions.length > 0);

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <label className="mb-1 block text-xs font-medium text-neutral-500">Search</label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setIsOpen(Boolean(value))}
          onKeyDown={handleKeyDown}
          placeholder="Cari berdasarkan Order ID..."
          className="w-full rounded-md border border-neutral-200 py-2 pl-9 pr-9 text-sm"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Bersihkan pencarian"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute z-20 mt-1 w-full max-h-80 overflow-y-auto rounded-md border border-neutral-200 bg-white shadow-lg">
          {isLoadingSuggestions && suggestions.length === 0 && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-neutral-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Mencari...
            </div>
          )}

          {!isLoadingSuggestions && suggestions.length === 0 && (
            <div className="px-4 py-3 text-sm text-neutral-400">Tidak ada pesanan yang sesuai dengan pencarian.</div>
          )}

          {suggestions.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSelect(s)}
              className="flex w-full flex-col gap-0.5 border-b border-neutral-50 px-4 py-2.5 text-left last:border-0 hover:bg-neutral-50"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-neutral-800">#{s.id.slice(0, 8).toUpperCase()}</span>
                <OrderStatusBadge status={s.status} />
              </div>
              <div className="flex items-center justify-between gap-2 text-xs text-neutral-500">
                <span>{s.namaUser ?? "-"}</span>
                <span>{formatDate(s.createdAt)}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
