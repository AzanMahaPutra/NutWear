import Image from "next/image";
import Link from "next/link";
import { Shirt } from "lucide-react";
import { ProductImage } from "@/types/product";
import { ROUTES } from "@/constants/routes";

interface ProductMainPhotoProps {
  images: ProductImage[];
  productName: string;
  productSlug: string;
  selectedColor: string;
}

/**
 * Foto utama produk — kalau warna yang dipilih punya foto utama sendiri, foto itu
 * yang ditampilkan. Kalau belum ada foto utama untuk warna tsb, fallback ke foto
 * galeri pertama supaya halaman tetap punya gambar (bukan kosong).
 *
 * Dirender sebagai SATU cell di dalam grid 2 kolom milik ProductGallery (bukan lagi
 * blok besar terpisah) supaya ukurannya seragam dengan foto galeri lain dan tidak
 * pecah di resolusi kecil. Selalu menempati cell pertama (kiri atas).
 *
 * UPDATE 3 — kalau foto ini punya pasangan produk, tampilkan icon kecil di sudut
 * kiri bawah yang membuka halaman "Pasangan Produk" khusus foto tsb.
 */
export function ProductMainPhoto({ images, productName, productSlug, selectedColor }: ProductMainPhotoProps) {
  const colorPhoto = images.find((img) => img.warna === selectedColor);
  const fallback = [...images].sort((a, b) => a.sortOrder - b.sortOrder)[0];
  const activeImage = colorPhoto ?? fallback;

  if (!activeImage) return null;

  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md bg-neutral-50">
      <Image
        src={activeImage.imageUrl}
        alt={`${productName}${selectedColor ? ` - ${selectedColor}` : ""}`}
        fill
        sizes="(min-width: 1024px) 20vw, 50vw"
        className="object-cover"
        priority
      />
      {activeImage.hasPairs && (
        <Link
          href={ROUTES.produkPasangan(productSlug, activeImage.id)}
          aria-label="Lihat Pasangan Produk"
          className="absolute bottom-2 left-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-neutral-800 shadow-md transition-transform hover:scale-105"
        >
          <Shirt className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
