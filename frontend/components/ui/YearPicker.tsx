"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

interface YearPickerProps {
  /** Tahun terpilih (mis. "2026"), atau "" apabila belum ada filter tahun aktif. */
  value: string;
  onChange: (year: string) => void;
  disabled?: boolean;
  label?: string;
}

const YEARS_PER_PAGE = 12;

function getPageStart(year: number) {
  return Math.floor(year / YEARS_PER_PAGE) * YEARS_PER_PAGE;
}

/**
 * UPDATE — Filter Tahun (Pesanan Admin): Year Picker bergaya kalender, menggantikan
 * dropdown tahun manual. Admin bisa berpindah halaman 12-tahun (tombol prev/next) untuk
 * memilih tahun berapa pun — tidak dibatasi daftar tahun yang ditentukan di source code,
 * jadi tetap berfungsi tanpa perlu update kode saat memasuki tahun baru.
 */
export function YearPicker({ value, onChange, disabled, label = "Tahun" }: YearPickerProps) {
  const currentYear = new Date().getFullYear();
  const selectedYear = value ? Number(value) : null;

  const [isOpen, setIsOpen] = useState(false);
  const [pageStart, setPageStart] = useState(() => getPageStart(selectedYear ?? currentYear));
  const containerRef = useRef<HTMLDivElement>(null);

  // Setiap popover dibuka, mulai dari halaman yang memuat tahun aktif (atau tahun sekarang).
  useEffect(() => {
    if (isOpen) {
      setPageStart(getPageStart(selectedYear ?? currentYear));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Tutup popover apabila Admin mengklik area di luar Year Picker.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelectYear(year: number) {
    onChange(String(year));
    setIsOpen(false);
  }

  function handleClear() {
    onChange("");
    setIsOpen(false);
  }

  const years = Array.from({ length: YEARS_PER_PAGE }, (_, i) => pageStart + i);

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1 block text-xs font-medium text-neutral-500">{label}</label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((o) => !o)}
        className="flex items-center gap-2 rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-700 disabled:bg-neutral-50 disabled:text-neutral-400"
      >
        <CalendarDays className="h-3.5 w-3.5 text-neutral-400" />
        {selectedYear ?? "Semua Tahun"}
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-20 mt-1 w-56 rounded-md border border-neutral-200 bg-white p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setPageStart((p) => p - YEARS_PER_PAGE)}
              aria-label="Tahun sebelumnya"
              className="rounded-md p-1 text-neutral-500 hover:bg-neutral-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-semibold text-neutral-600">
              {pageStart} – {pageStart + YEARS_PER_PAGE - 1}
            </span>
            <button
              type="button"
              onClick={() => setPageStart((p) => p + YEARS_PER_PAGE)}
              aria-label="Tahun berikutnya"
              className="rounded-md p-1 text-neutral-500 hover:bg-neutral-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1">
            {years.map((year) => (
              <button
                key={year}
                type="button"
                onClick={() => handleSelectYear(year)}
                className={`rounded-md px-2 py-1.5 text-sm transition-colors ${
                  year === selectedYear
                    ? "bg-neutral-800 text-white"
                    : year === currentYear
                      ? "font-semibold text-neutral-800 hover:bg-neutral-100"
                      : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                {year}
              </button>
            ))}
          </div>

          {selectedYear !== null && (
            <button
              type="button"
              onClick={handleClear}
              className="mt-2 w-full rounded-md px-2 py-1.5 text-center text-xs font-medium text-neutral-500 hover:bg-neutral-100"
            >
              Semua Tahun
            </button>
          )}
        </div>
      )}
    </div>
  );
}
