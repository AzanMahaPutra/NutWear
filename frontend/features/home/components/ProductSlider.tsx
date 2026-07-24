"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Product } from "@/types/product";
import { ProductCard } from "@/components/shared/ProductCard";
import { cn } from "@/utils/cn";

interface ProductSliderProps {
  products: Product[];
}

/**
 * Slider/carousel horizontal untuk daftar produk di Beranda.
 * Dipakai oleh `ProductRail` HANYA saat jumlah produk > 4, supaya section
 * produk (Terbaru/Terlaris/Rekomendasi) tidak turun ke baris kedua.
 *
 * Sengaja dibuat native (overflow-x + CSS scroll-snap) tanpa dependency
 * carousel baru, supaya tetap ringan walau jumlah produk banyak:
 * - Swipe di mobile memakai scroll horizontal bawaan browser (gratis, hemat JS).
 * - Drag pakai mouse di desktop ditangani manual lewat Pointer Events.
 * - Tombol Prev/Next menggeser satu "halaman" (selebar container yang terlihat)
 *   dengan smooth scroll bawaan browser (`scrollBy behavior: "smooth"`).
 * - Class `.no-scrollbar` (lihat app/globals.css) menyembunyikan scrollbar
 *   bawaan browser supaya terlihat seperti carousel, bukan area scroll biasa.
 * - Card produk (`ProductCard`) TIDAK diubah sama sekali — hanya dibungkus
 *   wrapper dengan lebar responsif per breakpoint.
 */
export function ProductSlider({ products }: ProductSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const didDrag = useRef(false);
  const dragStartX = useRef(0);
  const dragStartScrollLeft = useRef(0);

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateScrollButtons = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const maxScrollLeft = el.scrollWidth - el.clientWidth;
    setCanScrollPrev(el.scrollLeft > 4);
    setCanScrollNext(el.scrollLeft < maxScrollLeft - 4);
  }, []);

  // Pastikan tombol Prev/Next sinkron dengan posisi scroll & saat ukuran layar berubah
  // (mis. resize dari desktop ke tablet bisa mengubah apakah masih ada sisa produk).
  useEffect(() => {
    updateScrollButtons();
    const el = trackRef.current;
    if (!el) return;

    window.addEventListener("resize", updateScrollButtons);
    const resizeObserver = new ResizeObserver(updateScrollButtons);
    resizeObserver.observe(el);

    return () => {
      window.removeEventListener("resize", updateScrollButtons);
      resizeObserver.disconnect();
    };
  }, [updateScrollButtons]);

  function scrollByPage(direction: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: "smooth" });
  }

  // Drag-to-scroll pakai mouse (Pointer Events). Sentuhan (touch) sengaja dilewati
  // supaya swipe di HP tetap memakai scroll native bawaan browser yang lebih halus.
  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "touch") return;
    const el = trackRef.current;
    if (!el) return;
    isDragging.current = true;
    didDrag.current = false;
    dragStartX.current = e.clientX;
    dragStartScrollLeft.current = el.scrollLeft;
    el.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging.current) return;
    const el = trackRef.current;
    if (!el) return;
    const deltaX = e.clientX - dragStartX.current;
    if (Math.abs(deltaX) > 3) didDrag.current = true;
    el.scrollLeft = dragStartScrollLeft.current - deltaX;
  }

  function endDrag(e: React.PointerEvent<HTMLDivElement>) {
    isDragging.current = false;
    const el = trackRef.current;
    if (el && el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
  }

  // Cegah drag mouse tidak sengaja membuka halaman produk (klik di ujung drag).
  function handleClickCapture(e: React.MouseEvent<HTMLDivElement>) {
    if (didDrag.current) {
      e.preventDefault();
      e.stopPropagation();
      didDrag.current = false;
    }
  }

  return (
    <div className="relative">
      <div
        ref={trackRef}
        onScroll={updateScrollButtons}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onClickCapture={handleClickCapture}
        className="no-scrollbar flex cursor-grab snap-x snap-mandatory gap-x-6 overflow-x-auto scroll-smooth pb-2 active:cursor-grabbing"
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="w-[75%] flex-shrink-0 snap-start sm:w-[46%] md:w-[31%] lg:w-[calc(25%-18px)]"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {canScrollPrev && (
        <button
          type="button"
          onClick={() => scrollByPage(-1)}
          aria-label="Produk sebelumnya"
          className={cn(
            "absolute -left-3 top-[35%] z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-900 shadow-md transition hover:bg-neutral-50 sm:flex md:-left-4"
          )}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {canScrollNext && (
        <button
          type="button"
          onClick={() => scrollByPage(1)}
          aria-label="Produk selanjutnya"
          className={cn(
            "absolute -right-3 top-[35%] z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-900 shadow-md transition hover:bg-neutral-50 sm:flex md:-right-4"
          )}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
