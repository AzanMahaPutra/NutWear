import { Product } from "@/types/product";
import { AccordionItem } from "@/components/shared/AccordionItem";

interface ProductDescriptionProps {
  product: Product;
}

/**
 * Section "Deskripsi" di Detail Produk berisi accordion Fitur/Detail/Material/Pengiriman/Produksi.
 *
 * UPDATE 4 — accordion "Fitur" sekarang menampilkan daftar Fitur Produk dengan
 * Gambar kalau produk sudah punya data di `features`. Produk lama yang belum
 * punya Fitur Produk (features kosong/undefined) tetap tampil seperti
 * sebelumnya lewat teks `deskripsi`, jadi tidak ada error pada data lama.
 *
 * UPDATE 6 — Layout Fitur Produk direvisi: Judul Fitur dihapus (setiap fitur
 * sekarang hanya gambar + deskripsi), dan susunan diubah jadi grid 2 kolom
 * (2 fitur per baris di desktop/tablet, 1 fitur per baris di mobile). Setiap
 * item = gambar di kiri, deskripsi rata kiri di kanannya, tanpa card/border
 * besar dan tanpa elemen lain.
 *
 * UPDATE 5 — accordion Detail/Material/Pengiriman/Produksi sekarang menampilkan
 * data per produk (`detailInfo`/`materialCareInfo`/`shippingReturnInfo`/`productionInfo`,
 * diisi admin lewat halaman Tambah/Edit Produk). Kalau salah satu field kosong,
 * section tetap tampil dengan pesan EMPTY_SECTION_MESSAGE supaya layout konsisten.
 */
const EMPTY_SECTION_MESSAGE = "Informasi belum tersedia.";

export function ProductDescription({ product }: ProductDescriptionProps) {
  const features = product.features ?? [];

  return (
    <div className="mt-12">
      <h2 className="mb-1 text-xl font-bold text-neutral-900">Deskripsi</h2>
      <p className="mb-4 text-sm text-neutral-400">Kode Produk: {product.kodeProduk}</p>

      <AccordionItem title="Fitur" defaultOpen>
        {features.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
            {features.map((feature) => (
              <div key={feature.id} className="flex items-start gap-3">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={feature.imageUrl} alt="" className="h-full w-full object-cover" />
                </div>
                <p className="text-left text-sm text-neutral-600">{feature.deskripsi}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>{product.deskripsi}</p>
        )}
      </AccordionItem>
      <AccordionItem title="Detail">
        <p className="whitespace-pre-line">{product.detailInfo?.trim() || EMPTY_SECTION_MESSAGE}</p>
      </AccordionItem>
      <AccordionItem title="Material / Perawatan">
        <p className="whitespace-pre-line">{product.materialCareInfo?.trim() || EMPTY_SECTION_MESSAGE}</p>
      </AccordionItem>
      <AccordionItem title="Pengiriman / Penukaran / Pengembalian">
        <p className="whitespace-pre-line">{product.shippingReturnInfo?.trim() || EMPTY_SECTION_MESSAGE}</p>
      </AccordionItem>
      <AccordionItem title="Produksi">
        <p className="whitespace-pre-line">{product.productionInfo?.trim() || EMPTY_SECTION_MESSAGE}</p>
      </AccordionItem>
    </div>
  );
}
