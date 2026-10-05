"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { RotateCcw, Trash2 } from "lucide-react";
import { FormInput } from "@/components/ui/FormInput";
import { Banner, BannerFormPayload } from "@/services/bannerService";
import { useAdminBannerStore } from "@/stores/adminBannerStore";
import { useAdminProductStore } from "@/stores/adminProductStore";
import { useToastStore } from "@/stores/toastStore";
import { getApiErrorMessage } from "@/lib/apiTypes";
import { cn } from "@/utils/cn";
import { BannerPreview } from "@/features/admin/components/BannerPreview";
import type { PromoBannerData } from "@/features/home/components/PromoBanner";
import { DEFAULT_IMAGE_ADJUSTMENT, IMAGE_ADJUSTMENT_LIMITS, normalizeImageAdjustment } from "@/utils/bannerImage";

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

  priceNormal: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.coerce.number({
      required_error: "Harga normal wajib diisi",
      invalid_type_error: "Harga normal wajib diisi",
    }).min(0, "Harga tidak boleh negatif")
  ),
  priceNormalColor: z.string().optional(),
  priceNormalHeading: z.enum(HEADINGS).optional(),

  priceBeforeDiscount: z.union([z.coerce.number().min(0), z.literal("")]).optional(),
  priceBeforeDiscountColor: z.string().optional(),
  priceBeforeDiscountHeading: z.enum(HEADINGS).optional(),

  pricePromo: z.union([z.coerce.number().min(0), z.literal("")]).optional(),
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

  /** Pengaturan tampilan gambar latar (posisi % & zoom) — file gambar asli tidak diubah. */
  imagePositionX: z.coerce.number().min(0).max(100).optional(),
  imagePositionY: z.coerce.number().min(0).max(100).optional(),
  imageScale: z.coerce.number().min(1).max(3).optional(),

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
      imagePositionX: DEFAULT_IMAGE_ADJUSTMENT.positionX,
      imagePositionY: DEFAULT_IMAGE_ADJUSTMENT.positionY,
      imageScale: DEFAULT_IMAGE_ADJUSTMENT.scale,
    };
  }

  // Banner lama tanpa pengaturan -> default (tampilan sama seperti sebelumnya).
  const adjustment = normalizeImageAdjustment(initialData.imageAdjustment);

  return {
    imagePositionX: adjustment.positionX,
    imagePositionY: adjustment.positionY,
    imageScale: adjustment.scale,
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
    // pricePromo.value > 0 dianggap promo yang benar-benar diisi admin. Kalau nilainya
    // 0 (kemungkinan data lama dari bug sebelum perbaikan ini), tampilkan kosong di
    // form supaya konsisten dengan makna "kosong = tidak ada promo" — begitu admin
    // menyimpan ulang, data lama otomatis terlogika-benarkan tanpa perlu migrasi data.
    pricePromo: initialData.pricePromo.value > 0 ? initialData.pricePromo.value : "",
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

/**
 * Susun data banner untuk preview dari nilai form saat ini. Aturan fallback
 * disamakan dengan onSubmit + PromoBanner (promo kosong = Harga Normal, dst).
 */
function buildPreviewBanner(
  v: BannerFormValues,
  backgroundImageUrl: string,
  logoUrl: string | null
): PromoBannerData {
  const num = (x: unknown) => (x === "" || x === undefined || x === null || Number.isNaN(Number(x)) ? null : Number(x));
  const priceNormal = num(v.priceNormal) ?? 0;
  const pricePromo = num(v.pricePromo);
  const before = num(v.priceBeforeDiscount);

  return {
    backgroundImageUrl,
    imageAdjustment: normalizeImageAdjustment({
      positionX: v.imagePositionX,
      positionY: v.imagePositionY,
      scale: v.imageScale,
    }),
    brand: { name: v.brandName || null, logoUrl, logoSize: v.brandLogoSize ?? "medium" },
    title: {
      text: v.titleText || "Judul banner",
      color: v.titleColor ?? "#111111",
      heading: v.titleHeading ?? "h2",
      weight: v.titleWeight ?? "bold",
    },
    subtitle: {
      text: v.subtitleText || null,
      color: v.subtitleColor ?? null,
      heading: v.subtitleHeading ?? "h5",
      weight: v.subtitleWeight ?? "normal",
    },
    priceNormal: { value: priceNormal, color: v.priceNormalColor ?? "#111111", heading: v.priceNormalHeading ?? "h4" },
    priceBeforeDiscount:
      before === null
        ? null
        : { value: before, color: v.priceBeforeDiscountColor ?? "#737373", heading: v.priceBeforeDiscountHeading ?? "h5" },
    pricePromo: {
      value: pricePromo ?? priceNormal,
      color: v.pricePromoColor ?? "#dc2626",
      heading: v.pricePromoHeading ?? "h3",
    },
    limitedOffer:
      v.offerStartDate && v.offerEndDate
        ? {
            startDate: v.offerStartDate,
            endDate: v.offerEndDate,
            color: v.offerColor ?? "#dc2626",
            heading: v.offerHeading ?? "h6",
          }
        : null,
    cta: {
      text: v.ctaText || "Belanja Sekarang",
      link: "", // di preview tidak perlu bisa diklik
      bgColor: v.ctaBgColor ?? "#111111",
      textColor: v.ctaTextColor ?? "#ffffff",
      radius: Number(v.ctaRadius ?? 9999),
      size: v.ctaSize ?? "medium",
    },
  };
}

function SliderField({
  label,
  valueLabel,
  register,
  min,
  max,
  step,
}: {
  label: string;
  valueLabel: string;
  register: UseFormRegisterReturn;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between">
        <label className="text-xs font-semibold text-neutral-600">{label}</label>
        <span className="text-xs tabular-nums text-neutral-500">{valueLabel}</span>
      </div>
      <input type="range" min={min} max={max} step={step} {...register} className="w-full cursor-pointer accent-neutral-900" />
    </div>
  );
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
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BannerFormValues>({
    resolver: zodResolver(bannerSchema),
    defaultValues: defaultsFrom(initialData),
  });

  // Object URL dibuat sekali per file (bukan tiap render) — kalau tidak, setiap
  // gerakan slider membuat URL baru dan gambar preview akan berkedip/reload.
  const backgroundBlobUrl = useMemo(() => (backgroundImage ? URL.createObjectURL(backgroundImage) : null), [backgroundImage]);
  const logoBlobUrl = useMemo(() => (brandLogo ? URL.createObjectURL(brandLogo) : null), [brandLogo]);
  useEffect(() => () => { if (backgroundBlobUrl) URL.revokeObjectURL(backgroundBlobUrl); }, [backgroundBlobUrl]);
  useEffect(() => () => { if (logoBlobUrl) URL.revokeObjectURL(logoBlobUrl); }, [logoBlobUrl]);

  const backgroundPreview = backgroundBlobUrl ?? initialData?.backgroundImageUrl ?? null;
  const logoPreview = logoBlobUrl ?? (removeBrandLogo ? null : initialData?.brand.logoUrl ?? null);

  // watch() tanpa argumen = semua field; form re-render tiap perubahan -> preview realtime.
  const watched = watch();
  const adjustment = normalizeImageAdjustment({
    positionX: watched.imagePositionX,
    positionY: watched.imagePositionY,
    scale: watched.imageScale,
  });
  const previewBanner = backgroundPreview ? buildPreviewBanner(watched, backgroundPreview, logoPreview) : null;

  function setPosition(x: number, y: number) {
    setValue("imagePositionX", x, { shouldDirty: true, shouldTouch: true });
    setValue("imagePositionY", y, { shouldDirty: true, shouldTouch: true });
  }

  function setScale(scale: number) {
    setValue("imageScale", scale, { shouldDirty: true, shouldTouch: true });
  }

  function resetImageAdjustment() {
    setValue("imagePositionX", DEFAULT_IMAGE_ADJUSTMENT.positionX, { shouldDirty: true, shouldTouch: true });
    setValue("imagePositionY", DEFAULT_IMAGE_ADJUSTMENT.positionY, { shouldDirty: true, shouldTouch: true });
    setValue("imageScale", DEFAULT_IMAGE_ADJUSTMENT.scale, { shouldDirty: true, shouldTouch: true });
  }

  async function onSubmit(values: BannerFormValues) {
    try {
      const pricePromoValue =
        values.pricePromo === "" || values.pricePromo === undefined ? values.priceNormal : Number(values.pricePromo);

      const payload: Partial<BannerFormPayload> = {
        ...values,
        pricePromo: pricePromoValue,
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
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* Preview realtime: di layar lebar menempel di kanan saat form di-scroll, di mobile tampil di atas. */}
      <div className="order-1 lg:order-2 lg:sticky lg:top-0 lg:self-start">
        {previewBanner ? (
          <BannerPreview banner={previewBanner} />
        ) : (
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-neutral-300 px-4 text-center text-sm text-neutral-500">
            Upload Gambar Latar untuk melihat preview banner.
          </div>
        )}
      </div>

      <div className="order-2 lg:order-1 space-y-4">
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ColorField label="Warna Teks" register={register("titleColor")} />
          <SelectField label="Ukuran" register={register("titleHeading")} options={HEADINGS} labels={HEADING_LABEL} />
          <SelectField label="Ketebalan" register={register("titleWeight")} options={WEIGHTS} labels={WEIGHT_LABEL} />
        </div>
      </Section>

      <Section title="Sub Judul">
        <FormInput label="Teks" placeholder="Opsional" {...register("subtitleText")} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ColorField label="Warna Teks" register={register("priceNormalColor")} />
          <SelectField label="Ukuran" register={register("priceNormalHeading")} options={HEADINGS} labels={HEADING_LABEL} />
        </div>
      </Section>

      <Section title="Harga Sebelum Diskon (Opsional)">
        <FormInput label="Harga" type="number" placeholder="Kosongkan jika tidak ada" {...register("priceBeforeDiscount")} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

      <Section title="Harga Promo (Opsional)">
        <FormInput
          label="Harga"
          type="number"
          placeholder="Kosongkan jika tidak ada promo"
          {...register("pricePromo")}
          error={errors.pricePromo?.message}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ColorField label="Warna Teks" register={register("pricePromoColor")} />
          <SelectField label="Ukuran" register={register("pricePromoHeading")} options={HEADINGS} labels={HEADING_LABEL} />
        </div>
        <p className="text-xs text-neutral-500">
          Jika dikosongkan, banner akan menampilkan Harga Normal sebagai harga jual (tidak ada promo).
        </p>
      </Section>

      <Section title="Limited Offer (Opsional)">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormInput label="Mulai" type="date" {...register("offerStartDate")} />
          <FormInput label="Berakhir" type="date" {...register("offerEndDate")} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ColorField label="Warna Teks" register={register("offerColor")} />
          <SelectField label="Ukuran" register={register("offerHeading")} options={HEADINGS} labels={HEADING_LABEL} />
        </div>
      </Section>

      <Section title="Tombol CTA">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormInput label="Teks" placeholder="Belanja Sekarang" {...register("ctaText")} error={errors.ctaText?.message} />
          <FormInput label="Link" placeholder="/produk" {...register("ctaLink")} error={errors.ctaLink?.message} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ColorField label="Warna Background" register={register("ctaBgColor")} />
          <ColorField label="Warna Teks" register={register("ctaTextColor")} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

      <Section title="Pengaturan Tampilan Gambar">
        <p className="text-xs text-neutral-500">
          Atur bagian gambar yang ditampilkan di banner. Preview di samping/atas akan berubah langsung secara realtime.
        </p>

        {/* Tombol Cepat Posisi */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-neutral-600">Preset Posisi Cepat</label>
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setPosition(0, 0)}
              className={cn(
                "rounded border px-2 py-1 text-center font-medium transition-colors",
                adjustment.positionX === 0 && adjustment.positionY === 0
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 text-neutral-700 hover:bg-neutral-50"
              )}
            >
              Kiri Atas
            </button>
            <button
              type="button"
              onClick={() => setPosition(50, 0)}
              className={cn(
                "rounded border px-2 py-1 text-center font-medium transition-colors",
                adjustment.positionX === 50 && adjustment.positionY === 0
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 text-neutral-700 hover:bg-neutral-50"
              )}
            >
              Tengah Atas
            </button>
            <button
              type="button"
              onClick={() => setPosition(100, 0)}
              className={cn(
                "rounded border px-2 py-1 text-center font-medium transition-colors",
                adjustment.positionX === 100 && adjustment.positionY === 0
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 text-neutral-700 hover:bg-neutral-50"
              )}
            >
              Kanan Atas
            </button>
            <button
              type="button"
              onClick={() => setPosition(0, 50)}
              className={cn(
                "rounded border px-2 py-1 text-center font-medium transition-colors",
                adjustment.positionX === 0 && adjustment.positionY === 50
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 text-neutral-700 hover:bg-neutral-50"
              )}
            >
              Kiri Tengah
            </button>
            <button
              type="button"
              onClick={() => setPosition(50, 50)}
              className={cn(
                "rounded border px-2 py-1 text-center font-medium transition-colors",
                adjustment.positionX === 50 && adjustment.positionY === 50
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 text-neutral-700 hover:bg-neutral-50"
              )}
            >
              Tengah
            </button>
            <button
              type="button"
              onClick={() => setPosition(100, 50)}
              className={cn(
                "rounded border px-2 py-1 text-center font-medium transition-colors",
                adjustment.positionX === 100 && adjustment.positionY === 50
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 text-neutral-700 hover:bg-neutral-50"
              )}
            >
              Kanan Tengah
            </button>
            <button
              type="button"
              onClick={() => setPosition(0, 100)}
              className={cn(
                "rounded border px-2 py-1 text-center font-medium transition-colors",
                adjustment.positionX === 0 && adjustment.positionY === 100
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 text-neutral-700 hover:bg-neutral-50"
              )}
            >
              Kiri Bawah
            </button>
            <button
              type="button"
              onClick={() => setPosition(50, 100)}
              className={cn(
                "rounded border px-2 py-1 text-center font-medium transition-colors",
                adjustment.positionX === 50 && adjustment.positionY === 100
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 text-neutral-700 hover:bg-neutral-50"
              )}
            >
              Tengah Bawah
            </button>
            <button
              type="button"
              onClick={() => setPosition(100, 100)}
              className={cn(
                "rounded border px-2 py-1 text-center font-medium transition-colors",
                adjustment.positionX === 100 && adjustment.positionY === 100
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 text-neutral-700 hover:bg-neutral-50"
              )}
            >
              Kanan Bawah
            </button>
          </div>
        </div>

        <SliderField
          label="Posisi Horizontal (X)"
          valueLabel={`${adjustment.positionX}%`}
          register={register("imagePositionX")}
          {...IMAGE_ADJUSTMENT_LIMITS.position}
        />
        <SliderField
          label="Posisi Vertikal (Y)"
          valueLabel={`${adjustment.positionY}%`}
          register={register("imagePositionY")}
          {...IMAGE_ADJUSTMENT_LIMITS.position}
        />
        
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-xs font-semibold text-neutral-600">Preset Zoom</label>
            <div className="flex gap-1">
              {[1, 1.25, 1.5, 2].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScale(s)}
                  className={cn(
                    "rounded border px-2 py-0.5 text-xs font-medium transition-colors",
                    Math.abs(adjustment.scale - s) < 0.01
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                  )}
                >
                  {s}×
                </button>
              ))}
            </div>
          </div>
          <SliderField
            label="Zoom Halus"
            valueLabel={`${adjustment.scale.toFixed(2)}×`}
            register={register("imageScale")}
            {...IMAGE_ADJUSTMENT_LIMITS.scale}
          />
        </div>

        <button
          type="button"
          onClick={resetImageAdjustment}
          className="flex w-fit items-center gap-1 text-xs font-medium text-neutral-600 hover:underline"
        >
          <RotateCcw className="h-3 w-3" /> Reset ke default
        </button>
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
      </div>
    </form>
  );
}
