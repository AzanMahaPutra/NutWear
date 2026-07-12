import Link from "next/link";
import Image from "next/image";
import { Banner, HeadingLevel, SizeOption } from "@/services/bannerService";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";

const HEADING_TEXT_SIZE: Record<HeadingLevel, string> = {
  h1: "text-5xl md:text-6xl",
  h2: "text-4xl md:text-5xl",
  h3: "text-3xl md:text-4xl",
  h4: "text-2xl md:text-3xl",
  h5: "text-lg md:text-xl",
  h6: "text-sm md:text-base",
};

const WEIGHT_CLASS: Record<string, string> = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
};

const LOGO_SIZE_PX: Record<SizeOption, number> = { small: 32, medium: 48, large: 72 };
const CTA_SIZE_CLASS: Record<SizeOption, string> = {
  small: "px-4 py-2 text-xs",
  medium: "px-6 py-3 text-sm",
  large: "px-8 py-4 text-base",
};

/**
 * Banner promo di Beranda — kontennya berasal sepenuhnya dari Banner Builder API
 * (brand, judul/sub judul, harga normal/sebelum diskon/promo, limited offer, CTA).
 */
export function PromoBanner({ banner }: { banner: Banner }) {
  const { title, subtitle, brand, priceNormal, priceBeforeDiscount, pricePromo, limitedOffer, cta } = banner;

  const content = (
    <div className="relative isolate min-h-[480px] overflow-hidden bg-neutral-800">
      <Image src={banner.backgroundImageUrl} alt={title.text} fill sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />

      <div className="relative flex min-h-[480px] max-w-md flex-col justify-center gap-3 px-8 py-16 text-white md:px-16">
        {brand.logoUrl ? (
          <Image
            src={brand.logoUrl}
            alt={brand.name ?? "Brand"}
            width={LOGO_SIZE_PX[brand.logoSize]}
            height={LOGO_SIZE_PX[brand.logoSize]}
            className="object-contain"
          />
        ) : (
          brand.name && <span className="text-sm font-semibold uppercase tracking-wide text-white/80">{brand.name}</span>
        )}

        <span
          className={`${HEADING_TEXT_SIZE[title.heading]} ${WEIGHT_CLASS[title.weight]}`}
          style={{ color: title.color }}
        >
          {title.text}
        </span>

        {subtitle.text && subtitle.heading && subtitle.weight && (
          <span
            className={`${HEADING_TEXT_SIZE[subtitle.heading]} ${WEIGHT_CLASS[subtitle.weight]}`}
            style={{ color: subtitle.color ?? undefined }}
          >
            {subtitle.text}
          </span>
        )}

        <div className="flex items-baseline gap-3">
          <span className={`${HEADING_TEXT_SIZE[pricePromo.heading]} font-bold`} style={{ color: pricePromo.color }}>
            {formatCurrency(pricePromo.value)}
          </span>
          {priceBeforeDiscount && (
            <span
              className={`${HEADING_TEXT_SIZE[priceBeforeDiscount.heading]} line-through`}
              style={{ color: priceBeforeDiscount.color }}
            >
              {formatCurrency(priceBeforeDiscount.value)}
            </span>
          )}
        </div>

        {priceNormal.value > 0 && !priceBeforeDiscount && (
          <span className={`${HEADING_TEXT_SIZE[priceNormal.heading]}`} style={{ color: priceNormal.color }}>
            {formatCurrency(priceNormal.value)}
          </span>
        )}

        {limitedOffer && (
          <span className={`${HEADING_TEXT_SIZE[limitedOffer.heading]} font-medium`} style={{ color: limitedOffer.color }}>
            Berlaku {formatDate(limitedOffer.startDate)} – {formatDate(limitedOffer.endDate)}
          </span>
        )}

        <span
          className={`mt-2 w-fit font-semibold transition-transform hover:scale-105 ${CTA_SIZE_CLASS[cta.size]}`}
          style={{ backgroundColor: cta.bgColor, color: cta.textColor, borderRadius: cta.radius }}
        >
          {cta.text}
        </span>
      </div>
    </div>
  );

  return cta.link ? <Link href={cta.link}>{content}</Link> : content;
}
