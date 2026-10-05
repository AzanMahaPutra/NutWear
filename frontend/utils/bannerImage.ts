import type { CSSProperties } from "react";

/**
 * Pengaturan tampilan gambar latar banner (BUKAN edit file gambar — file asli
 * tidak pernah diubah). Satu-satunya sumber aturan posisi/zoom: dipakai oleh
 * PromoBanner di Beranda DAN preview di modal admin, jadi hasilnya identik.
 */
export interface BannerImageAdjustment {
  /** object-position horizontal, 0–100 (%). 50 = tengah. */
  positionX: number;
  /** object-position vertikal, 0–100 (%). 50 = tengah. */
  positionY: number;
  /** Zoom, 1–3. 1 = tanpa zoom. */
  scale: number;
}

export const IMAGE_ADJUSTMENT_LIMITS = {
  position: { min: 0, max: 100, step: 1 },
  scale: { min: 1, max: 3, step: 0.05 },
} as const;

/** Default = tampilan lama (object-cover, center, tanpa zoom). */
export const DEFAULT_IMAGE_ADJUSTMENT: BannerImageAdjustment = { positionX: 50, positionY: 50, scale: 1 };

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

function toNumber(value: unknown, fallback: number) {
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Aman untuk banner lama / API lama / nilai string dari input form. */
export function normalizeImageAdjustment(raw?: Partial<Record<keyof BannerImageAdjustment, unknown>> | null): BannerImageAdjustment {
  const { position, scale } = IMAGE_ADJUSTMENT_LIMITS;
  return {
    positionX: clamp(toNumber(raw?.positionX, DEFAULT_IMAGE_ADJUSTMENT.positionX), position.min, position.max),
    positionY: clamp(toNumber(raw?.positionY, DEFAULT_IMAGE_ADJUSTMENT.positionY), position.min, position.max),
    scale: clamp(toNumber(raw?.scale, DEFAULT_IMAGE_ADJUSTMENT.scale), scale.min, scale.max),
  };
}

/**
 * Style untuk <img>/<Image fill className="object-cover">. Posisi lewat
 * object-position (persentase, jadi konsisten di semua lebar layar); zoom lewat
 * transform dengan titik tumpu = titik fokus yang sama, sehingga bagian yang
 * dipilih admin tetap terlihat saat di-zoom. Container wajib overflow-hidden.
 */
export function getBannerImageStyle(raw?: Partial<Record<keyof BannerImageAdjustment, unknown>> | null): CSSProperties {
  const { positionX, positionY, scale } = normalizeImageAdjustment(raw);
  return {
    objectPosition: `${positionX}% ${positionY}%`,
    transformOrigin: `${positionX}% ${positionY}%`,
    transform: scale === 1 ? undefined : `scale(${scale})`,
  };
}
