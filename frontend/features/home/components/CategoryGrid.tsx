import Link from "next/link";
import Image from "next/image";
import { Shirt } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ROUTES } from "@/constants/routes";
import { categoryService } from "@/services/categoryService";

/**
 * Grid "Jenis & Kategori Produk" di Beranda — Server Component, fetch dari Category API.
 * Sekarang menampilkan gambar kategori yang diupload admin (imageUrl).
 * Fallback ke ikon Shirt kalau kategori belum punya gambar.
 */
export async function CategoryGrid() {
  let categories: { id: string; namaKategori: string; imageUrl?: string | null }[] = [];
  try {
    categories = await categoryService.getAll();
  } catch {
    categories = [];
  }

  if (categories.length === 0) return null;

  return (
    <Container className="py-14">
      <h2 className="mb-10 text-center text-3xl font-bold text-neutral-900">
        Jenis &amp; Kategori
        <br />
        Produk
      </h2>

      <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={ROUTES.kategoriDetail(category.id)}
            className="group flex flex-col items-center gap-3 text-center"
          >
            <div className="relative aspect-square w-full max-w-[180px] overflow-hidden rounded-lg bg-neutral-50 transition-transform group-hover:scale-105">
              {category.imageUrl ? (
                <Image
                  src={category.imageUrl}
                  alt={category.namaKategori}
                  fill
                  sizes="(min-width: 640px) 180px, 45vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Shirt className="h-12 w-12 text-neutral-400" />
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-neutral-800">{category.namaKategori}</span>
          </Link>
        ))}
      </div>
    </Container>
  );
}
