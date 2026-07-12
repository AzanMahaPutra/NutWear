import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ImageOff, Sparkles } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { productService } from "@/services/productService";
import { formatCurrency } from "@/utils/formatCurrency";
import { isPromoActive } from "@/utils/promo";
import { ROUTES } from "@/constants/routes";
import { enrichProduct } from "@/utils/enrichProduct";

interface PasanganProdukPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ imageId?: string }>;
}

export const metadata: Metadata = {
  title: "Pasangan Produk",
};

async function safeGetProductBySlug(slug: string) {
  try {
    return await productService.getBySlug(slug);
  } catch {
    return null;
  }
}

/**
 * UPDATE 3 — Halaman "Pasangan Produk" sekarang tampil per FOTO Gallery
 * Produk (bukan lagi satu daftar untuk keseluruhan produk). Dibuka lewat
 * icon pada foto gallery yang punya pasangan, membawa `?imageId=...` supaya
 * halaman ini tahu foto mana yang jadi konteks "Produk Utama" & pasangan
 * produk mana saja yang ditampilkan.
 *
 * Kalau halaman diakses tanpa `imageId` (mis. link lama), fallback ke foto
 * cover produk supaya halaman tetap bisa dibuka tanpa error.
 */
export default async function PasanganProdukPage({ params, searchParams }: PasanganProdukPageProps) {
  const { slug } = await params;
  const { imageId } = await searchParams;

  const rawProduct = await safeGetProductBySlug(slug);
  if (!rawProduct) notFound();

  const product = enrichProduct(rawProduct);
  const activeImage =
    (imageId ? product.images.find((img) => img.id === imageId) : undefined) ??
    [...product.images].sort((a, b) => a.sortOrder - b.sortOrder)[0];

  if (!activeImage) notFound();

  const pairs = await productService.getImagePairs(activeImage.id).catch(() => []);

  return (
    <Container className="py-8">
      <h1 className="mb-8 text-3xl font-bold text-neutral-900">Pasangan Produk</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-neutral-50">
          <Image src={activeImage.imageUrl} alt={product.namaProduk} fill sizes="50vw" className="object-cover" />
        </div>

        <div>
          <div className="flex gap-4 border-b border-neutral-100 py-5">
            <div className="relative flex h-28 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md bg-neutral-50">
              <Image src={activeImage.imageUrl} alt={product.namaProduk} fill sizes="96px" className="object-cover" />
              {product.isNewArrival && (
                <span className="absolute left-1 top-1 flex items-center gap-0.5 rounded-full bg-neutral-900 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                  <Sparkles className="h-2.5 w-2.5" /> Baru
                </span>
              )}
            </div>
            <div className="flex-1">
              <Link href={ROUTES.produkDetail(product.slug)} className="text-sm font-semibold text-neutral-900">
                {product.namaProduk}
              </Link>
              {activeImage.warna && <p className="mt-1 text-xs text-neutral-500">Warna: {activeImage.warna}</p>}
              <div className="mt-1 flex items-center gap-2">
                {isPromoActive(product) && product.hargaPromo != null ? (
                  <>
                    <span className="text-xs text-neutral-400 line-through">{formatCurrency(product.harga)}</span>
                    <span className="text-sm font-bold" style={{ color: product.hargaPromoColor || "#dc2626" }}>
                      {formatCurrency(product.hargaPromo)}
                    </span>
                  </>
                ) : (
                  <span className="text-sm font-bold text-neutral-900">{formatCurrency(product.harga)}</span>
                )}
              </div>
            </div>
          </div>

          {pairs.length === 0 && (
            <p className="py-5 text-sm text-neutral-500">Belum ada pasangan produk untuk foto ini.</p>
          )}

          {pairs.map((item) => (
            <Link
              key={item.id}
              href={ROUTES.produkDetail(item.slug)}
              className="flex gap-4 border-b border-neutral-100 py-5 last:border-0"
            >
              <div className="relative flex h-28 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md bg-neutral-50">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt={item.namaProduk} fill sizes="96px" className="object-cover" />
                ) : (
                  <ImageOff className="h-5 w-5 text-neutral-300" />
                )}
                {item.isNewArrival && (
                  <span className="absolute left-1 top-1 flex items-center gap-0.5 rounded-full bg-neutral-900 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                    <Sparkles className="h-2.5 w-2.5" /> Baru
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-neutral-900">{item.namaProduk}</p>
                {item.warna && <p className="mt-0.5 text-xs text-neutral-500">Warna: {item.warna}</p>}
                <div className="mt-1 flex items-center gap-2">
                  {item.isPromoActive && item.hargaPromo != null ? (
                    <>
                      <span className="text-xs text-neutral-400 line-through">{formatCurrency(item.harga)}</span>
                      <span className="text-sm font-bold" style={{ color: item.hargaPromoColor }}>
                        {formatCurrency(item.hargaPromo)}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm font-bold text-neutral-900">{formatCurrency(item.harga)}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}

          <Link
            href={ROUTES.produkDetail(product.slug)}
            className="mt-6 block w-fit rounded-full border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-700"
          >
            KEMBALI KE HALAMAN SEBELUMNYA
          </Link>
        </div>
      </div>
    </Container>
  );
}
