import { type ClassValue, clsx } from "clsx";

/**
 * Helper untuk menggabungkan className secara kondisional.
 * Dipakai di hampir semua komponen UI reusable.
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
