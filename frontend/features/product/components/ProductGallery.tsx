import Image from "next/image";
import Link from "next/link";
import { Shirt } from "lucide-react";
import { ProductImage } from "@/types/product";
import { ProductMainPhoto } from "@/features/product/components/ProductMainPhoto";
import { ROUTES } from "@/constants/routes";

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
  productSlug: string;
  /** Foto utama (cell pertama) berubah mengikuti warna yang dipilih user. */
  selectedColor: string;
}

/**
 * Galeri gambar produk — grid 2 kolom yang seragam, sesuai desain:
 * [ Foto Utama ] [ Gallery 1 ]
 * [ Gallery 2 ]  [ Gallery 3 ]
 * ...dan seterusnya.
 *
 * Foto utama SELALU menempati kolom kiri pertama dan berubah saat user memilih
 * warna berbeda (lewat ProductMainPhoto), sementara foto galeri umum (warna = null)
 * mengisi sisa kolom kanan & baris berikutnya secara berurutan. Semua cell memakai
 * ukuran/aspect-ratio yang sama dengan object-cover supaya gambar tidak pecah/
 * terdistorsi walau resolusi asli tidak terlalu tinggi, dan layout tetap responsive
 * (2 kolom) baik di desktop maupun mobile.
 *
 * UPDATE 3 — foto (utama maupun galeri umum) yang punya pasangan produk
 * menampilkan icon kecil di sudut kiri bawah yang membuka halaman "Pasangan
 * Produk" khusus foto tsb.
 */
export function ProductGallery({ images, productName, productSlug, selectedColor }: ProductGalleryProps) {
  const galleryImages = images.filter((img) => !img.warna).sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="grid grid-cols-2 gap-2">
      <ProductMainPhoto images={images} productName={productName} productSlug={productSlug} selectedColor={selectedColor} />

      {galleryImages.map((image, index) => (
        <div key={image.id} className="relative aspect-[3/4] overflow-hidden rounded-md bg-neutral-50">
          <Image
            src={image.imageUrl}
            alt={`${productName} - foto ${index + 1}`}
            fill
            sizes="(min-width: 1024px) 20vw, 50vw"
            className="object-cover"
          />
          {image.hasPairs && (
            <Link
              href={ROUTES.produkPasangan(productSlug, image.id)}
              aria-label="Lihat Pasangan Produk"
              className="absolute bottom-2 left-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-neutral-800 shadow-md transition-transform hover:scale-105"
            >
              <Shirt className="h-4 w-4" />
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
