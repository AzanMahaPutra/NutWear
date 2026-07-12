"use client";

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { Product, ProductImage } from "@/types/product";
import { productService } from "@/services/productService";
import { useToastStore } from "@/stores/toastStore";
import { getApiErrorMessage } from "@/lib/apiTypes";
import { GalleryPairingEditor } from "@/features/admin/components/GalleryPairingEditor";

interface ProductPhotoManagerProps {
  productId: string;
  variants: Product["variants"];
  initialImages: ProductImage[];
}

/**
 * Manajemen foto produk:
 * - Galeri umum (warna = null) — perilaku lama: upload banyak foto, hapus kapan saja.
 * - Foto utama per warna — 1 foto per warna (diambil dari daftar warna varian).
 *   Upload ulang otomatis MENGGANTI foto lama (bukan menambah baris baru).
 *   Foto ini yang berubah saat user memilih warna di halaman detail produk;
 *   foto warna lain & galeri umum tidak ikut berubah.
 * - Pasangan Produk per foto (UPDATE 3) — setiap foto (galeri umum maupun foto
 *   utama per warna) bisa diatur pasangan produknya masing-masing lewat
 *   GalleryPairingEditor di bawah foto tsb.
 */
export function ProductPhotoManager({ productId, variants, initialImages }: ProductPhotoManagerProps) {
  const [images, setImages] = useState(initialImages);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const showToast = useToastStore((s) => s.showToast);

  const uniqueColors = useMemo(() => Array.from(new Set(variants.map((v) => v.warna))), [variants]);
  const galleryImages = images.filter((img) => !img.warna).sort((a, b) => a.sortOrder - b.sortOrder);
  const colorImage = (warna: string) => images.find((img) => img.warna === warna);

  async function handleUploadGallery(file: File | null) {
    if (!file) return;
    setUploadingKey("gallery");
    try {
      const nextSortOrder = galleryImages.length;
      const image = await productService.uploadImage(productId, file, { sortOrder: nextSortOrder });
      setImages((prev) => [...prev, image]);
      showToast("Foto galeri berhasil diupload");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    } finally {
      setUploadingKey(null);
    }
  }

  async function handleUploadColorPhoto(warna: string, file: File | null) {
    if (!file) return;
    setUploadingKey(warna);
    try {
      const image = await productService.uploadImage(productId, file, { warna });
      setImages((prev) => [...prev.filter((img) => img.warna !== warna), image]);
      showToast(`Foto utama warna ${warna} berhasil disimpan`);
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    } finally {
      setUploadingKey(null);
    }
  }

  async function handleRemoveImage(imageId: string) {
    try {
      await productService.removeImage(imageId);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      showToast("Foto berhasil dihapus");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  }

  function handlePairCountChange(imageId: string, count: number) {
    setImages((prev) => prev.map((img) => (img.id === imageId ? { ...img, hasPairs: count > 0 } : img)));
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="mb-2 text-sm font-semibold text-neutral-800">Galeri Produk</h4>
        <div className="mb-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {galleryImages.map((img) => (
            <div key={img.id} className="space-y-1.5">
              <div className="group relative aspect-square overflow-hidden rounded-md border border-neutral-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.imageUrl} alt="Foto galeri" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(img.id)}
                  aria-label="Hapus foto"
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-red-500 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <GalleryPairingEditor
                imageId={img.id}
                currentProductId={productId}
                initialHasPairs={Boolean(img.hasPairs)}
                onCountChange={handlePairCountChange}
              />
            </div>
          ))}
        </div>
        <input
          type="file"
          accept="image/*"
          disabled={uploadingKey === "gallery"}
          onChange={(e) => handleUploadGallery(e.target.files?.[0] ?? null)}
          className="w-full text-xs text-neutral-500"
        />
      </div>

      {uniqueColors.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-neutral-800">Foto Utama per Warna</h4>
          <p className="mb-2 text-xs text-neutral-500">
            Foto ini yang berubah saat user memilih warna di halaman detail produk.
          </p>
          <div className="space-y-2">
            {uniqueColors.map((warna) => {
              const existing = colorImage(warna);
              return (
                <div key={warna} className="space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-white">
                      {existing ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={existing.imageUrl} alt={warna} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-neutral-400">
                          Belum ada
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="mb-1 text-xs font-semibold text-neutral-800">{warna}</p>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingKey === warna}
                        onChange={(e) => handleUploadColorPhoto(warna, e.target.files?.[0] ?? null)}
                        className="w-full text-xs text-neutral-500"
                      />
                    </div>
                    {existing && (
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(existing.id)}
                        aria-label={`Hapus foto warna ${warna}`}
                        className="rounded-md border border-red-200 p-1.5 text-red-500 hover:bg-white"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  {existing && (
                    <GalleryPairingEditor
                      imageId={existing.id}
                      currentProductId={productId}
                      initialHasPairs={Boolean(existing.hasPairs)}
                      onCountChange={handlePairCountChange}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
