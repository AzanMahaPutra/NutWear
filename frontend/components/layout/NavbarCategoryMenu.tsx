"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, Shirt } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { ROUTES } from "@/constants/routes";
import { categoryService } from "@/services/categoryService";
import { Category } from "@/types/product";

interface NavbarCategoryMenuProps {
  /**
   * "desktop" — dropdown melayang (absolute) di bawah tombol Kategori, dipakai di baris
   * menu nav desktop (Beranda / Produk / Kategori).
   * "mobile" — accordion/expand-collapse inline, mengikuti pola AccordionItem yang sudah
   * dipakai di project (mis. Detail Produk), supaya nyaman dipakai di layar kecil.
   */
  variant?: "desktop" | "mobile";
}

/**
 * Menu "Kategori" pada Navbar utama.
 *
 * Data kategori (termasuk gambarnya) diambil langsung dari Category API — sama seperti
 * yang dipakai halaman Category Admin & CategoryGrid di Beranda — sehingga kategori baru
 * yang ditambahkan admin otomatis muncul di sini tanpa perlu ubah kode.
 *
 * Interaksi (Update 1, Bagian 2):
 * - Dropdown/accordion dibuka & ditutup dengan KLIK (bukan hover lagi), supaya tidak
 *   tertutup sendiri saat cursor sedikit keluar dari area menu.
 * - Setelah terbuka, tetap terbuka sampai: user memilih salah satu kategori, user klik
 *   di luar area menu (atau menekan Escape), atau user menekan tombol Kategori lagi.
 *
 * Klik salah satu kategori mengarahkan ke halaman Produk dengan filter kategori langsung
 * aktif lewat ROUTES.produkKategori (mekanisme filter kategori yang sudah dipakai halaman
 * Produk — lihat app/(shop)/produk/page.tsx & ProductShopView — tidak ada logika filter baru
 * yang ditambahkan di sini).
 */
export function NavbarCategoryMenu({ variant = "desktop" }: NavbarCategoryMenuProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setIsLoading(true);
    categoryService
      .getAll()
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function renderItems(itemClassName: string) {
    if (isLoading) {
      return (
        <div className="space-y-3 px-4 py-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 shrink-0 rounded" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))}
        </div>
      );
    }

    if (categories.length === 0) {
      return <p className="px-4 py-3 text-sm text-neutral-400">Belum ada kategori</p>;
    }

    return categories.map((category) => (
      <Link
        key={category.id}
        href={ROUTES.produkKategori(category.id)}
        role="menuitem"
        onClick={() => setOpen(false)}
        className={itemClassName}
      >
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-neutral-50">
          {category.imageUrl ? (
            <Image src={category.imageUrl} alt={category.namaKategori} fill sizes="40px" className="object-cover" />
          ) : (
            <Shirt className="h-4 w-4 text-neutral-300" />
          )}
        </span>
        <span className="truncate">{category.namaKategori}</span>
      </Link>
    ));
  }

  if (variant === "mobile") {
    return (
      <div ref={wrapperRef}>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="true"
          aria-expanded={open}
          className="flex w-full items-center justify-between py-3 text-sm font-semibold text-neutral-900"
        >
          Kategori
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>

        {/* Trik CSS grid-rows untuk animasi expand/collapse yang halus tanpa perlu ukur tinggi via JS. */}
        <div
          className={`grid transition-all duration-300 ease-in-out ${
            open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <div role="menu" aria-label="Kategori produk" className="space-y-1 pb-3">
              {renderItems(
                "flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        className="flex items-center gap-1 transition-colors hover:text-neutral-900"
      >
        Kategori
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Kategori produk"
          className="animate-navbar-dropdown absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 overflow-hidden rounded-lg border border-neutral-100 bg-white py-2 text-left shadow-lg"
        >
          {renderItems(
            "flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
          )}
        </div>
      )}
    </div>
  );
}
