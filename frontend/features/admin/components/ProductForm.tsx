"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormInput } from "@/components/ui/FormInput";
import { useAdminCategoryStore } from "@/stores/adminCategoryStore";
import { Product } from "@/types/product";
import { useAdminProductStore } from "@/stores/adminProductStore";
import { useToastStore } from "@/stores/toastStore";
import { getApiErrorMessage } from "@/lib/apiTypes";
import { VariantManager } from "@/features/admin/components/VariantManager";
import { ProductPhotoManager } from "@/features/admin/components/ProductPhotoManager";
import { ProductFeatureManager } from "@/features/admin/components/ProductFeatureManager";
import { Section, ColorField } from "@/features/admin/components/BannerForm";
import { GENDER_OPTIONS } from "@/features/product/types/filter";

const productSchema = z.object({
  namaProduk: z.string().min(3, "Nama produk minimal 3 karakter"),
  categoryId: z.string().uuid("Pilih kategori"),
  harga: z.coerce.number().min(1000, "Harga minimal Rp1.000"),
  hargaPromo: z.union([z.coerce.number().min(0), z.literal("")]).optional(),
  hargaPromoColor: z.string().optional(),
  promoMulai: z.string().optional(),
  promoSelesai: z.string().optional(),
  berat: z.coerce.number().min(1, "Berat wajib diisi"),
  deskripsi: z.string().min(10, "Deskripsi minimal 10 karakter"),
  isNewArrival: z.boolean().optional(),
  gender: z.enum(["pria", "wanita", "uniseks"], { errorMap: () => ({ message: "Gender produk wajib dipilih" }) }),
  // UPDATE 5 — Detail Produk dapat Dikelola per Produk. Semua opsional (boleh kosong,
  // Detail Produk menampilkan "Informasi belum tersedia." kalau kosong).
  detailInfo: z.string().optional(),
  materialCareInfo: z.string().optional(),
  shippingReturnInfo: z.string().optional(),
  productionInfo: z.string().optional(),
});
type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData?: Product;
  onSuccess: () => void;
}

/**
 * Form tambah/edit produk untuk Admin — terhubung penuh ke Product API:
 * create/update data inti produk, lalu foto (galeri umum + foto utama per warna),
 * varian (ukuran/warna/SKU/stok — bisa diedit/dihapus langsung), dan pasangan
 * produk (via SKU) ditampilkan setelah produk tersimpan (semuanya butuh productId).
 */
export function ProductForm({ initialData, onSuccess }: ProductFormProps) {
  const categories = useAdminCategoryStore((s) => s.categories);
  const fetchCategories = useAdminCategoryStore((s) => s.fetchCategories);
  const addProduct = useAdminProductStore((s) => s.addProduct);
  const updateProduct = useAdminProductStore((s) => s.updateProduct);
  const showToast = useToastStore((s) => s.showToast);

  const [savedProduct, setSavedProduct] = useState<Product | undefined>(initialData);

  useEffect(() => {
    if (categories.length === 0) fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData
      ? {
          namaProduk: initialData.namaProduk,
          categoryId: initialData.kategoriId,
          harga: initialData.harga,
          hargaPromo: initialData.hargaPromo ?? "",
          hargaPromoColor: initialData.hargaPromoColor ?? "#dc2626",
          promoMulai: initialData.promoMulai ?? "",
          promoSelesai: initialData.promoSelesai ?? "",
          berat: initialData.berat,
          deskripsi: initialData.deskripsi,
          isNewArrival: initialData.isNewArrival ?? false,
          gender: initialData.gender ?? "uniseks",
          detailInfo: initialData.detailInfo ?? "",
          materialCareInfo: initialData.materialCareInfo ?? "",
          shippingReturnInfo: initialData.shippingReturnInfo ?? "",
          productionInfo: initialData.productionInfo ?? "",
        }
      : { hargaPromoColor: "#dc2626", isNewArrival: false },
  });

  async function onSubmit(values: ProductFormValues) {
    try {
      const payload = {
        ...values,
        hargaPromo: values.hargaPromo === "" || values.hargaPromo === undefined ? null : Number(values.hargaPromo),
        promoMulai: values.promoMulai === "" || values.promoMulai === undefined ? null : values.promoMulai,
        promoSelesai: values.promoSelesai === "" || values.promoSelesai === undefined ? null : values.promoSelesai,
      };

      let product: Product;
      if (savedProduct) {
        await updateProduct(savedProduct.id, payload);
        product = { ...savedProduct, ...payload, kategoriId: payload.categoryId };
        showToast("Produk berhasil diperbarui");
      } else {
        product = await addProduct(payload);
        showToast("Produk berhasil ditambahkan");
      }

      setSavedProduct(product);
      if (!initialData) {
        // Produk baru: biarkan admin lanjut menambahkan foto/varian/pasangan sebelum menutup modal.
        return;
      }
      onSuccess();
    } catch (err) {
      // Log raw error for easier debugging in client console and derive a
      // friendly message when possible (Axios response message or Error.message).
      // Fall back to generic message if none available.
      // eslint-disable-next-line no-console
      console.error("ProductForm save error:", err);
      const rawMessage = (err as any)?.response?.data?.message ?? (err as any)?.message;
      showToast(rawMessage ?? "Terjadi kesalahan, silakan coba lagi", "error");
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Section title="Informasi Produk">
          <FormInput label="Nama" placeholder="Nama produk" {...register("namaProduk")} error={errors.namaProduk?.message} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="w-full">
              <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3.5 focus-within:border-neutral-900">
                <label className="shrink-0 text-sm font-semibold text-neutral-800">Kategori</label>
                <select {...register("categoryId")} className="w-full bg-transparent text-right text-sm outline-none">
                  <option value="">Pilih kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.namaKategori}
                    </option>
                  ))}
                </select>
              </div>
              {errors.categoryId && <p className="mt-1 text-xs text-red-500">{errors.categoryId.message}</p>}
            </div>

            <div className="w-full">
              <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3.5 focus-within:border-neutral-900">
                <label className="shrink-0 text-sm font-semibold text-neutral-800">Gender</label>
                <select {...register("gender")} className="w-full bg-transparent text-right text-sm outline-none">
                  <option value="">Pilih gender</option>
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
              {errors.gender && <p className="mt-1 text-xs text-red-500">{errors.gender.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormInput
              label="Berat (gram)"
              type="number"
              placeholder="220"
              {...register("berat")}
              error={errors.berat?.message}
            />

            <label className="flex h-[52px] w-full cursor-pointer items-center gap-2.5 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3.5 text-sm font-semibold text-neutral-800">
              <input type="checkbox" {...register("isNewArrival")} className="h-4 w-4 shrink-0 rounded border-neutral-300" />
              Tandai sebagai New Arrival
            </label>
          </div>

          <div className="w-full">
            <label className="mb-1 block text-sm font-semibold text-neutral-800">Deskripsi</label>
            <textarea
              {...register("deskripsi")}
              rows={4}
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm outline-none focus:border-neutral-900"
              placeholder="Deskripsi produk"
            />
            {errors.deskripsi && <p className="mt-1 text-xs text-red-500">{errors.deskripsi.message}</p>}
          </div>
        </Section>

        <Section title="Harga">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormInput
              label="Harga Normal"
              type="number"
              placeholder="249000"
              {...register("harga")}
              error={errors.harga?.message}
            />
            <FormInput
              label="Harga Promo (Opsional)"
              type="number"
              placeholder="Kosongkan jika tidak ada promo"
              {...register("hargaPromo")}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <ColorField label="Warna Harga Promo" register={register("hargaPromoColor")} />
            <FormInput label="Promo Mulai (Opsional)" type="date" {...register("promoMulai")} />
            <FormInput label="Promo Selesai (Opsional)" type="date" {...register("promoSelesai")} />
          </div>
          <p className="text-xs text-neutral-500">
            Jika Harga Promo diisi, halaman produk menampilkan Harga Normal dengan efek strikethrough dan Harga
            Promo lebih menonjol memakai warna di atas (default merah). Periode Promo (opsional) ditampilkan pada
            Notifikasi Promo Produk yang dikirim ke seluruh user.
          </p>
        </Section>

        <Section title="Detail Produk">
          <p className="-mt-1 text-xs text-neutral-500">
            Ditampilkan pada accordion Detail/Material/Pengiriman/Produksi di halaman Detail Produk. Kosongkan
            bagian yang belum ada isinya — akan tampil sebagai &quot;Informasi belum tersedia.&quot;.
          </p>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="w-full">
              <label className="mb-1 block text-sm font-semibold text-neutral-800">Detail</label>
              <textarea
                {...register("detailInfo")}
                rows={3}
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm outline-none focus:border-neutral-900"
                placeholder="Informasi detail produk"
              />
            </div>
            <div className="w-full">
              <label className="mb-1 block text-sm font-semibold text-neutral-800">Material / Perawatan</label>
              <textarea
                {...register("materialCareInfo")}
                rows={3}
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm outline-none focus:border-neutral-900"
                placeholder="Jenis bahan, cara mencuci, cara merawat produk, dll"
              />
            </div>
            <div className="w-full">
              <label className="mb-1 block text-sm font-semibold text-neutral-800">
                Pengiriman / Penukaran / Pengembalian
              </label>
              <textarea
                {...register("shippingReturnInfo")}
                rows={3}
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm outline-none focus:border-neutral-900"
                placeholder="Estimasi pengiriman, kebijakan penukaran/pengembalian, syarat retur"
              />
            </div>
            <div className="w-full">
              <label className="mb-1 block text-sm font-semibold text-neutral-800">Produksi</label>
              <textarea
                {...register("productionInfo")}
                rows={3}
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm outline-none focus:border-neutral-900"
                placeholder="Negara asal produksi, pabrik, proses produksi, dll"
              />
            </div>
          </div>
        </Section>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-neutral-900 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isSubmitting ? "Menyimpan..." : savedProduct ? "Simpan Perubahan" : "Simpan & Lanjut Kelola Foto/Varian"}
        </button>
      </form>

      {savedProduct && (
        <div className="space-y-5 border-t border-neutral-100 pt-5">
          <Section title="Variant (Warna, SKU, Ukuran, Stok, Gallery)">
            <VariantManager productId={savedProduct.id} initialVariants={savedProduct.variants} />
            <div className="border-t border-neutral-100 pt-4">
              <ProductPhotoManager
                productId={savedProduct.id}
                variants={savedProduct.variants}
                initialImages={savedProduct.images}
              />
            </div>
          </Section>

          <Section title="Fitur Produk">
            <ProductFeatureManager productId={savedProduct.id} initialFeatures={savedProduct.features ?? []} />
          </Section>

          <button
            type="button"
            onClick={onSuccess}
            className="w-full rounded-full border border-neutral-300 py-2.5 text-sm font-semibold text-neutral-700"
          >
            Selesai
          </button>
        </div>
      )}
    </div>
  );
}
