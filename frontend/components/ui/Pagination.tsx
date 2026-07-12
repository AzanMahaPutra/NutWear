"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/utils/cn";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * Pagination reusable — dipakai di halaman Produk, Riwayat Pesanan, dan Admin (produk/pesanan/pelanggan).
 */
export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="mt-10 flex items-center justify-center gap-2">
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 disabled:opacity-30"
        aria-label="Halaman sebelumnya"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-colors",
            page === currentPage ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
          )}
        >
          {page}
        </button>
      ))}

      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 disabled:opacity-30"
        aria-label="Halaman berikutnya"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
