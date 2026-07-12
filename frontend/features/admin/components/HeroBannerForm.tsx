"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormInput } from "@/components/ui/FormInput";
import { HeroBanner, HeroBannerFormPayload } from "@/services/heroBannerService";
import { useAdminHeroBannerStore } from "@/stores/adminHeroBannerStore";
import { useAdminProductStore } from "@/stores/adminProductStore";
import { useAdminCategoryStore } from "@/stores/adminCategoryStore";
import { useToastStore } from "@/stores/toastStore";
import { getApiErrorMessage } from "@/lib/apiTypes";
import { cn } from "@/utils/cn";

const LINK_TYPES = ["none", "product", "category", "custom"] as const;
const LINK_TYPE_LABEL: Record<(typeof LINK_TYPES)[number], string> = {
  none: "Tidak ada (tidak bisa diklik)",
  product: "Produk Tertentu",
  category: "Halaman Kategori",
  custom: "Halaman Lain (link bebas)",
};

const heroBannerSchema = z
  .object({
    title: z.string().optional(),
    linkType: z.enum(LINK_TYPES),
    productId: z.string().optional(),
    categoryId: z.string().optional(),
    customUrl: z.string().optional(),
    isActive: z.boolean().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.linkType === "product" && !values.productId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["productId"], message: "Produk tujuan wajib dipilih" });
    }
    if (values.linkType === "category" && !values.categoryId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["categoryId"], message: "Kategori tujuan wajib dipilih" });
    }
    if (values.linkType === "custom" && !values.customUrl) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["customUrl"], message: "Link tujuan wajib diisi" });
    }
  });

type HeroBannerFormValues = z.infer<typeof heroBannerSchema>;

function defaultsFrom(initialData?: HeroBanner): Partial<HeroBannerFormValues> {
  if (!initialData) {
    return { linkType: "none", isActive: true };
  }

  return {
    title: initialData.title ?? "",
    linkType: initialData.link.type,
    productId: initialData.link.product?.id ?? "",
    categoryId: initialData.link.category?.id ?? "",
    customUrl: initialData.link.customUrl ?? "",
    isActive: initialData.isActive,
  };
}

function ImagePicker({
  label,
  previewUrl,
  onPick,
  required,
}: {
  label: string;
  previewUrl: string | null;
  onPick: (file: File | null) => void;
  required?: boolean;
}) {
  return (
    <div className="w-full">
      <label className="mb-1 block text-xs font-semibold text-neutral-600">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex items-center gap-3">
        {previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt={label} className="h-16 w-28 rounded-lg border border-neutral-200 object-cover" />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
          className="w-full text-xs text-neutral-500"
        />
      </div>
    </div>
  );
}

export function HeroBannerForm({ initialData, onSuccess }: { initialData?: HeroBanner; onSuccess: () => void }) {
  const addHeroBanner = useAdminHeroBannerStore((s) => s.addHeroBanner);
  const updateHeroBanner = useAdminHeroBannerStore((s) => s.updateHeroBanner);
  const showToast = useToastStore((s) => s.showToast);

  // Daftar produk & kategori untuk dropdown "Link Tujuan" — sumber data yang
  // sama dengan halaman Manajemen Produk & Kategori (di-cache di store).
  const products = useAdminProductStore((s) => s.products);
  const fetchProducts = useAdminProductStore((s) => s.fetchProducts);
  const categories = useAdminCategoryStore((s) => s.categories);
  const fetchCategories = useAdminCategoryStore((s) => s.fetchCategories);
  useEffect(() => {
    if (products.length === 0) fetchProducts();
    if (categories.length === 0) fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [image, setImage] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<HeroBannerFormValues>({
    resolver: zodResolver(heroBannerSchema),
    defaultValues: defaultsFrom(initialData),
  });

  const linkType = watch("linkType");
  const imagePreview = image ? URL.createObjectURL(image) : initialData?.imageUrl ?? null;

  async function onSubmit(values: HeroBannerFormValues) {
    try {
      const payload: Partial<HeroBannerFormPayload> = {
        title: values.title,
        linkType: values.linkType,
        productId: values.linkType === "product" ? values.productId : null,
        categoryId: values.linkType === "category" ? values.categoryId : null,
        customUrl: values.linkType === "custom" ? values.customUrl : null,
        isActive: values.isActive,
        image,
      };

      if (initialData) {
        await updateHeroBanner(initialData.id, payload);
        showToast("Hero banner berhasil diperbarui");
      } else {
        if (!image) {
          showToast("Gambar hero banner wajib diupload", "error");
          return;
        }
        await addHeroBanner(payload as HeroBannerFormPayload);
        showToast("Hero banner berhasil ditambahkan");
      }
      onSuccess();
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <ImagePicker label="Gambar Hero" previewUrl={imagePreview} onPick={setImage} required={!initialData} />

      <FormInput label="Judul" placeholder="Opsional" {...register("title")} />

      <div className="w-full">
        <label className="mb-1 block text-xs font-semibold text-neutral-600">Link Tujuan</label>
        <select
          {...register("linkType")}
          className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
        >
          {LINK_TYPES.map((type) => (
            <option key={type} value={type}>
              {LINK_TYPE_LABEL[type]}
            </option>
          ))}
        </select>
      </div>

      {linkType === "product" && (
        <div className="w-full">
          <label className="mb-1 block text-xs font-semibold text-neutral-600">Produk Tujuan</label>
          <select
            {...register("productId")}
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
          >
            <option value="">Pilih produk</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.namaProduk}
                {p.variants?.[0]?.sku ? ` — SKU: ${p.variants[0].sku}` : ""}
              </option>
            ))}
          </select>
          {errors.productId && <p className="mt-1 text-xs text-red-500">{errors.productId.message}</p>}
        </div>
      )}

      {linkType === "category" && (
        <div className="w-full">
          <label className="mb-1 block text-xs font-semibold text-neutral-600">Kategori Tujuan</label>
          <select
            {...register("categoryId")}
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
          >
            <option value="">Pilih kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.namaKategori}
              </option>
            ))}
          </select>
          {errors.categoryId && <p className="mt-1 text-xs text-red-500">{errors.categoryId.message}</p>}
        </div>
      )}

      {linkType === "custom" && (
        <FormInput
          label="Link"
          placeholder="/produk atau https://..."
          {...register("customUrl")}
          error={errors.customUrl?.message}
        />
      )}

      <label className="flex items-center gap-2 text-sm font-medium text-neutral-800">
        <input type="checkbox" {...register("isActive")} className="h-4 w-4 rounded border-neutral-300" />
        Tampilkan hero banner ini
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className={cn("w-full rounded-full bg-neutral-900 py-3 text-sm font-semibold text-white disabled:opacity-60")}
      >
        {isSubmitting ? "Menyimpan..." : initialData ? "Simpan Perubahan" : "Tambah Hero Banner"}
      </button>
    </form>
  );
}
