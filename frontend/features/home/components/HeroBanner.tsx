"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HeroBanner as HeroBannerData } from "@/services/heroBannerService";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/utils/cn";

const AUTOPLAY_INTERVAL_MS = 5000;

/**
 * Hero Banner utama di Beranda — carousel visual full-image yang mengambil
 * gambar dari data Hero Banner Admin (`hero_banners`, tabel & pengelolaan
 * yang terpisah dari Banner Produk). Fokus utamanya gambar, bukan teks:
 * hanya judul singkat (opsional) sebagai overlay tipis di bagian bawah.
 *
 * Kalau admin belum membuat hero banner sama sekali, fallback ke hero
 * statis lama supaya Beranda tidak kosong.
 */
export function HeroBanner({ banners }: { banners: HeroBannerData[] }) {
  if (banners.length === 0) return <StaticFallbackHero />;
  return <HeroCarousel banners={banners} />;
}

function heroBannerHref(banner: HeroBannerData): string | null {
  const { link } = banner;
  if (link.type === "product" && link.product) return ROUTES.produkDetail(link.product.slug);
  if (link.type === "category" && link.category) return ROUTES.produkKategori(link.category.id);
  if (link.type === "custom" && link.customUrl) return link.customUrl;
  return null;
}

function HeroCarousel({ banners }: { banners: HeroBannerData[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const hasMultiple = banners.length > 1;

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex(((index % banners.length) + banners.length) % banners.length);
    },
    [banners.length]
  );
  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  // Autoplay — berhenti sementara saat user hover (desktop) atau sedang swipe (mobile).
  useEffect(() => {
    if (!hasMultiple || isPaused) return;
    const timer = setInterval(goNext, AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [hasMultiple, isPaused, goNext]);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    setIsPaused(true);
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const SWIPE_THRESHOLD = 40;
    if (deltaX > SWIPE_THRESHOLD) goPrev();
    else if (deltaX < -SWIPE_THRESHOLD) goNext();
    touchStartX.current = null;
    setIsPaused(false);
  }

  return (
    <div
      className="relative isolate w-full overflow-hidden bg-neutral-200"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Tinggi tetap per breakpoint supaya gambar proporsional dan tidak ada layout shift. */}
      <div className="relative h-[240px] w-full sm:h-[340px] md:h-[440px] lg:h-[520px]">
        <div
          className="flex h-full w-full transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {banners.map((banner, index) => (
            <HeroSlide key={banner.id} banner={banner} priority={index === 0} />
          ))}
        </div>
      </div>

      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label="Banner sebelumnya"
            className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-neutral-900 backdrop-blur transition hover:bg-white md:left-5 md:h-11 md:w-11"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Banner selanjutnya"
            className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-neutral-900 backdrop-blur transition hover:bg-white md:right-5 md:h-11 md:w-11"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
            {banners.map((banner, index) => (
              <button
                key={banner.id}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Ke banner ${index + 1}`}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  index === activeIndex ? "w-6 bg-white" : "w-1.5 bg-white/60 hover:bg-white/80"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function HeroSlide({ banner, priority }: { banner: HeroBannerData; priority: boolean }) {
  const href = heroBannerHref(banner);

  const image = (
    <div className="relative h-full w-full">
      <Image
        src={banner.imageUrl}
        alt={banner.title || "Banner"}
        fill
        sizes="100vw"
        priority={priority}
        className="object-cover"
      />
      {banner.title && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent px-5 py-4 md:px-10 md:py-6">
          <p className="max-w-md text-sm font-semibold text-white md:text-base">{banner.title}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative h-full w-full flex-shrink-0">
      {href ? (
        <Link href={href} className="block h-full w-full" aria-label={banner.title || "Lihat selengkapnya"}>
          {image}
        </Link>
      ) : (
        image
      )}
    </div>
  );
}

/** Fallback saat admin belum membuat Hero Banner sama sekali. */
function StaticFallbackHero() {
  return (
    <div className="relative isolate flex h-[240px] w-full items-center justify-center overflow-hidden bg-neutral-900 text-white sm:h-[340px] md:h-[440px] lg:h-[520px]">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-extrabold md:text-5xl">NEW ARRIVAL</h1>
        <p className="max-w-md text-sm text-white/80 md:text-base">
          Temukan tampilan sempurna untuk hari-harimu.
        </p>
        <Link
          href={ROUTES.produk}
          className="mt-2 w-fit rounded-full bg-white px-6 py-3 text-sm font-semibold text-neutral-900 transition-transform hover:scale-105"
        >
          BELANJA SEKARANG
        </Link>
      </div>
    </div>
  );
}
