"use client";

import { useEffect, useState } from "react";
import { useForm, UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trash2 } from "lucide-react";
import { FormInput } from "@/components/ui/FormInput";
import { Banner, BannerFormPayload } from "@/services/bannerService";
import { useAdminBannerStore } from "@/stores/adminBannerStore";
import { useAdminProductStore } from "@/stores/adminProductStore";
import { useToastStore } from "@/stores/toastStore";
import { getApiErrorMessage } from "@/lib/apiTypes";
import { cn } from "@/utils/cn";

const HEADINGS = ["h1", "h2", "h3", "h4", "h5", "h6"] as const;
const WEIGHTS = ["normal", "medium", "semibold", "bold"] as const;
const SIZES = ["small", "medium", "large"] as const;

const HEADING_LABEL: Record<(typeof HEADINGS)[number], string> = {
  h1: "H1 — Sangat Besar",
  h2: "H2 — Besar",
  h3: "H3 — Sedang Besar",
  h4: "H4 — Sedang",
  h5: "H5 — Kecil",
  h6: "H6 — Sangat Kecil",
};
const WEIGHT_LABEL: Record<(typeof WEIGHTS)[number], string> = {
  normal: "Normal",
  medium: "Medium",
  semibold: "Semibold",
  bold: "Bold",
};
const SIZE_LABEL: Record<(typeof SIZES)[number], string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
};

const bannerSchema = z.object({
  brandName: z.string().optional(),
  brandLogoSize: z.enum(SIZES).optional(),

  titleText: z.string().min(1, "Judul wajib diisi"),
  titleColor: z.string().optional(),
  titleHeading: z.enum(HEADINGS).optional(),
  titleWeight: z.enum(WEIGHTS).optional(),

  subtitleText: z.string().optional(),
  subtitleColor: z.string().optional(),
  subtitleHeading: z.enum(HEADINGS).optional(),
  subtitleWeight: z.enum(WEIGHTS).optional(),

  priceNormal: z.coerce.number({ invalid_type_error: "Harga normal wajib diisi" }).min(0, "Harga tidak boleh negatif"),
  priceNormalColor: z.string().optional(),
  priceNormalHeading: z.enum(HEADINGS).optional(),

  priceBeforeDiscount: z.union([z.coerce.number().min(0), z.literal("")]).optional(),
  priceBeforeDiscountColor: z.string().optional(),
  priceBeforeDiscountHeading: z.enum(HEADINGS).optional(),

  pricePromo: z.coerce.number({ invalid_type_error: "Harga promo wajib diisi" }).min(0, "Harga tidak boleh negatif"),
  pricePromoColor: z.string().optional(),
  pricePromoHeading: z.enum(HEADINGS).optional(),

  offerStartDate: z.string().optional(),
  offerEndDate: z.string().optional(),
  offerColor: z.string().optional(),
  offerHeading: z.enum(HEADINGS).optional(),

  ctaText: z.string().min(1, "Teks tombol wajib diisi"),
  ctaLink: z.string().min(1, "Link tombol wajib diisi"),
  ctaBgColor: z.string().optional(),
  ctaTextColor: z.string().optional(),
  ctaRadius: z.coerce.number().min(0).optional(),
  ctaSize: z.enum(SIZES).optional(),

  isActive: z.boolean().optional(),

  /** Produk tujuan saat banner diklik user di Hero Banner Beranda. Kosong = tidak ada aksi klik. */
  productId: z.string().optional(),
});

type BannerFormValues = z.infer<typeof bannerSchema>;

function defaultsFrom(initialData?: Banner): Partial<BannerFormValues> {
  if (!initialData) {
    return {
      brandLogoSize: "medium",
      titleColor: "#111111",
      titleHeading: "h2",
      titleWeight: "bold",
      subtitleColor: "#404040",
      subtitleHeading: "h5",
      subtitleWeight: "normal",
      priceNormalColor: "#111111",
      priceNormalHeading: "h4",
      priceBeforeDiscountColor: "#737373",
      priceBeforeDiscountHeading: "h5",
      pricePromoColor: "#dc2626",
      pricePromoHeading: "h3",
      offerColor: "#dc2626",
      offerHeading: "h6",
      ctaText: "Belanja Sekarang",
      ctaBgColor: "#111111",
      ctaTextColor: "#ffffff",
      ctaRadius: 9999,
      ctaSize: "medium",
      isActive: true,
      productId: "",
    };
  }

  return {
    brandName: initialData.brand.name ?? "",
    brandLogoSize: initialData.brand.logoSize,
    titleText: initialData.title.text,
    titleColor: initialData.title.color,
    titleHeading: initialData.title.heading,
    titleWeight: initialData.title.weight,
    subtitleText: initialData.subtitle.text ?? "",
    subtitleColor: initialData.subtitle.color ?? "#404040",
    subtitleHeading: initialData.subtitle.heading ?? "h5",
    subtitleWeight: initialData.subtitle.weight ?? "normal",
    priceNormal: initialData.priceNormal.value,
    priceNormalColor: initialData.priceNormal.color,
    priceNormalHeading: initialData.priceNormal.heading,
    priceBeforeDiscount: initialData.priceBeforeDiscount?.value ?? "",
    priceBeforeDiscountColor: initialData.priceBeforeDiscount?.color ?? "#737373",
    priceBeforeDiscountHeading: initialData.priceBeforeDiscount?.heading ?? "h5",
    pricePromo: initialData.pricePromo.value,
    pricePromoColor: initialData.pricePromo.color,
    pricePromoHeading: initialData.pricePromo.heading,
    offerStartDate: initialData.limitedOffer?.startDate ?? "",
    offerEndDate: initialData.limitedOffer?.endDate ?? "",
    offerColor: initialData.limitedOffer?.color ?? "#dc2626",
    offerHeading: initialData.limitedOffer?.heading ?? "h6",
    ctaText: initialData.cta.text,
    ctaLink: initialData.cta.link,
    ctaBgColor: initialData.cta.bgColor,
    ctaTextColor: initialData.cta.textColor,
    ctaRadius: initialData.cta.radius,
    ctaSize: initialData.cta.size,
    isActive: initialData.isActive,
    productId: initialData.targetProduct?.id ?? "",
  };
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-neutral-200 p-4">
      <h4 className="mb-3 text-sm font-bold text-neutral-900">{title}</h4>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function SelectField({
  label,
  register,
  options,
  labels,
}: {
  label: string;
  register: UseFormRegisterReturn;
  options: readonly string[];
  labels: Record<string, string>;
}) {
  return (
    <div className="w-full">
      <label className="mb-1 block text-xs font-semibold text-neutral-600">{label}</label>
      <select {...register} className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900">
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {labels[opt]}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ColorField({
  label,
  register,
}: {
  label: string;
  register: UseFormRegisterReturn;
}) {
  return (
    <div className="w-full">
      <label className="mb-1 block text-xs font-semibold text-neutral-600">{label}</label>
      <input type="color" {...register} className="h-9 w-full cursor-pointer rounded-lg border border-neutral-200 p-1" />
    </div>
  );
}

function ImagePicker({
  label,
  previewUrl,
  onPick,
  onRemove,
  required,
}: {
  label: string;
  previewUrl: string | null;
  onPick: (file: File | null) => void;
  onRemove?: () => void;
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
          <img src={previewUrl} alt={label} className="h-16 w-16 rounded-lg border border-neutral-200 object-cover" />
        )}
        <div className="flex flex-1 flex-col gap-1">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onPick(e.target.files?.[0] ?? null)}
            className="w-full text-xs text-neutral-500"
          />
          {previewUrl && onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="flex w-fit items-center gap-1 text-xs font-medium text-red-500 hover:underline"
            >
              <Trash2 className="h-3 w-3" /> Hapus gambar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function BannerForm({ initialData, onSuccess }: { initialData?: Banner; onSuccess: () => void }) {
  const addBanner = useAdminBannerStore((s) => s.addBanner);
  const updateBanner = useAdminBannerStore((s) => s.updateBanner);
  const showToast = useToastStore((s) => s.showToast);

  // Daftar produk untuk dropdown "Produk Tujuan" — diambil dari database produk
  // yang sama dengan halaman Manajemen Produk (di-cache di store, jadi tidak
  // fetch ulang kalau admin sudah pernah membuka halaman Produk).
  const products = useAdminProductStore((s) => s.products);
  const fetchProducts = useAdminProductStore((s) => s.fetchProducts);
  useEffect(() => {
    if (products.length === 0) fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [backgroundImage, setBackgroundImage] = useState<File | null>(null);
  const [brandLogo, setBrandLogo] = useState<File | null>(null);
  const [removeBrandLogo, setRemoveBrandLogo] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BannerFormValues>({
    resolver: zodResolver(bannerSchema),
    defaultValues: defaultsFrom(initialData),
  });

  const backgroundPreview = backgroundImage ? URL.createObjectURL(backgroundImage) : initialData?.backgroundImageUrl ?? null;
  const logoPreview = brandLogo
    ? URL.createObjectURL(brandLogo)
    : removeBrandLogo
      ? null
      : initialData?.brand.logoUrl ?? null;

  async function onSubmit(values: BannerFormValues) {
    try {
      const payload: Partial<BannerFormPayload> = {
        ...values,
        priceBeforeDiscount: values.priceBeforeDiscount === "" ? null : Number(values.priceBeforeDiscount),
        backgroundImage,
        brandLogo,
        removeBrandLogo,
      };

      if (initialData) {
        await updateBanner(initialData.id, payload);
        showToast("Banner berhasil diperbarui");
      } else {
        if (!backgroundImage) {
          showToast("Gambar latar banner wajib diupload", "error");
          return;
        }
        await addBanner(payload as BannerFormPayload);
        showToast("Banner berhasil ditambahkan");
      }
      onSuccess();
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Section title="Brand">
        <FormInput label="Nama Brand" placeholder="Opsional" {...register("brandName")} />
        <ImagePicker
          label="Logo Brand"
          previewUrl={logoPreview}
          onPick={(file) => {
            setBrandLogo(file);
            if (file) setRemoveBrandLogo(false);
          }}
          onRemove={() => {
            setBrandLogo(null);
            setRemoveBrandLogo(true);
          }}
        />
        <SelectField label="Ukuran Logo" register={register("brandLogoSize")} options={SIZES} labels={SIZE_LABEL} />
      </Section>

      <Section title="Judul Banner">
        <FormInput label="Teks" placeholder="Judul banner" {...register("titleText")} error={errors.titleText?.message} />
        <div className="grid grid-cols-3 gap-3">
          <ColorField label="Warna Teks" register={register("titleColor")} />
          <SelectField label="Ukuran" register={register("titleHeading")} options={HEADINGS} labels={HEADING_LABEL} />
          <SelectField label="Ketebalan" register={register("titleWeight")} options={WEIGHTS} labels={WEIGHT_LABEL} />
        </div>
      </Section>

      <Section title="Sub Judul">
        <FormInput label="Teks" placeholder="Opsional" {...register("subtitleText")} />
        <div className="grid grid-cols-3 gap-3">
          <ColorField label="Warna Teks" register={register("subtitleColor")} />
          <SelectField label="Ukuran" register={register("subtitleHeading")} options={HEADINGS} labels={HEADING_LABEL} />
          <SelectField label="Ketebalan" register={register("subtitleWeight")} options={WEIGHTS} labels={WEIGHT_LABEL} />
        </div>
      </Section>

      <Section title="Harga Normal">
        <FormInput
          label="Harga"
          type="number"
          placeholder="0"
          {...register("priceNormal")}
          error={errors.priceNormal?.message}
        />
        <div className="grid grid-cols-2 gap-3">
          <ColorField label="Warna Teks" register={register("priceNormalColor")} />
          <SelectField label="Ukuran" register={register("priceNormalHeading")} options={HEADINGS} labels={HEADING_LABEL} />
        </div>
      </Section>

      <Section title="Harga Sebelum Diskon (Opsional)">
        <FormInput label="Harga" type="number" placeholder="Kosongkan jika tidak ada" {...register("priceBeforeDiscount")} />
        <div className="grid grid-cols-2 gap-3">
          <ColorField label="Warna Teks" register={register("priceBeforeDiscountColor")} />
          <SelectField
            label="Ukuran"
            register={register("priceBeforeDiscountHeading")}
            options={HEADINGS}
            labels={HEADING_LABEL}
          />
        </div>
        <p className="text-xs text-neutral-500">Jika diisi, frontend menampilkan harga ini dengan efek strikethrough.</p>
      </Section>

      <Section title="Harga Promo">
        <FormInput
          label="Harga"
          type="number"
          placeholder="0"
          {...register("pricePromo")}
          error={errors.pricePromo?.message}
        />
        <div className="grid grid-cols-2 gap-3">
          <ColorField label="Warna Teks" register={register("pricePromoColor")} />
          <SelectField label="Ukuran" register={register("pricePromoHeading")} options={HEADINGS} labels={HEADING_LABEL} />
        </div>
      </Section>

      <Section title="Limited Offer (Opsional)">
        <div className="grid grid-cols-2 gap-3">
          <FormInput label="Mulai" type="date" {...register("offerStartDate")} />
          <FormInput label="Berakhir" type="date" {...register("offerEndDate")} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <ColorField label="Warna Teks" register={register("offerColor")} />
          <SelectField label="Ukuran" register={register("offerHeading")} options={HEADINGS} labels={HEADING_LABEL} />
        </div>
      </Section>

      <Section title="Tombol CTA">
        <div className="grid grid-cols-2 gap-3">
          <FormInput label="Teks" placeholder="Belanja Sekarang" {...register("ctaText")} error={errors.ctaText?.message} />
          <FormInput label="Link" placeholder="/produk" {...register("ctaLink")} error={errors.ctaLink?.message} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <ColorField label="Warna Background" register={register("ctaBgColor")} />
          <ColorField label="Warna Teks" register={register("ctaTextColor")} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormInput label="Radius" type="number" placeholder="9999" {...register("ctaRadius")} />
          <SelectField label="Ukuran" register={register("ctaSize")} options={SIZES} labels={SIZE_LABEL} />
        </div>
      </Section>

      <Section title="Tujuan Banner (Opsional)">
        <div className="w-full">
          <label className="mb-1 block text-xs font-semibold text-neutral-600">Produk Tujuan</label>
          <select
            {...register("productId")}
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
          >
            <option value="">Tidak ada (banner tidak bisa diklik)</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.namaProduk}
                {p.variants?.[0]?.sku ? ` — SKU: ${p.variants[0].sku}` : ""}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-neutral-500">
            Saat user menekan banner ini di Beranda, mereka akan diarahkan ke halaman detail produk yang dipilih.
          </p>
        </div>
      </Section>

      <Section title="Background Banner">
        <ImagePicker
          label="Gambar Latar"
          previewUrl={backgroundPreview}
          onPick={(file) => setBackgroundImage(file)}
          required={!initialData}
        />
      </Section>

      <label className="flex items-center gap-2 text-sm font-medium text-neutral-800">
        <input type="checkbox" {...register("isActive")} className="h-4 w-4 rounded border-neutral-300" />
        Tampilkan banner ini
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          "w-full rounded-full bg-neutral-900 py-3 text-sm font-semibold text-white disabled:opacity-60"
        )}
      >
        {isSubmitting ? "Menyimpan..." : initialData ? "Simpan Perubahan" : "Tambah Banner"}
      </button>
    </form>
  );
}
