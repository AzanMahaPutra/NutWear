"use client";

import { X } from "lucide-react";

interface SizeChartModalProps {
  open: boolean;
  onClose: () => void;
}

const SIZE_ROWS = [
  { size: "S", lebarDada: 55, panjang: 68 },
  { size: "M", lebarDada: 58, panjang: 70 },
  { size: "L", lebarDada: 61, panjang: 72 },
  { size: "XL", lebarDada: 64, panjang: 74 },
];

/**
 * Modal panduan ukuran (Size Chart) reusable — dipanggil dari Detail Produk.
 */
export function SizeChartModal({ open, onClose }: SizeChartModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-lg bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">Panduan Ukuran</h3>
          <button type="button" onClick={onClose} aria-label="Tutup">
            <X className="h-5 w-5" />
          </button>
        </div>

        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-500">
              <th className="py-2">Ukuran</th>
              <th className="py-2">Lebar Dada (cm)</th>
              <th className="py-2">Panjang (cm)</th>
            </tr>
          </thead>
          <tbody>
            {SIZE_ROWS.map((row) => (
              <tr key={row.size} className="border-b border-neutral-100">
                <td className="py-2 font-medium">{row.size}</td>
                <td className="py-2">{row.lebarDada}</td>
                <td className="py-2">{row.panjang}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4 text-xs text-neutral-400">
          Ukuran dapat berbeda ±2cm tergantung metode pengukuran manual.
        </p>
      </div>
    </div>
  );
}
