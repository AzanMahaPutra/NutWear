"use client";

import { useEffect, useRef, useState } from "react";
import { Monitor, Smartphone, Tablet } from "lucide-react";
import { PromoBannerView, PromoBannerData } from "@/features/home/components/PromoBanner";
import { cn } from "@/utils/cn";

const DEVICES = {
  desktop: { label: "Desktop", width: 1280, Icon: Monitor },
  tablet: { label: "Tablet", width: 768, Icon: Tablet },
  mobile: { label: "Mobile", width: 390, Icon: Smartphone },
} as const;

type Device = keyof typeof DEVICES;

/**
 * Preview realtime banner di modal admin. Merender PromoBannerView — komponen
 * yang SAMA dengan Beranda — pada lebar virtual perangkat (desktop/tablet/mobile),
 * lalu diperkecil agar muat di panel. Dengan begitu rasio & pemotongan gambar
 * (object-position + zoom) sama dengan yang dilihat pembeli di lebar tersebut.
 * Catatan: ukuran font mengikuti breakpoint viewport admin, jadi teks bersifat perkiraan.
 */
export function BannerPreview({ banner, className }: { banner: PromoBannerData; className?: string }) {
  const [device, setDevice] = useState<Device>("desktop");
  const frameRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [frameWidth, setFrameWidth] = useState(0);
  const [innerHeight, setInnerHeight] = useState(0);

  useEffect(() => {
    const frame = frameRef.current;
    const inner = innerRef.current;
    if (!frame || !inner) return;
    const measure = () => {
      setFrameWidth(frame.clientWidth);
      setInnerHeight(inner.offsetHeight);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    observer.observe(inner);
    return () => observer.disconnect();
  }, [device]);

  const virtualWidth = DEVICES[device].width;
  const scale = frameWidth > 0 ? Math.min(1, frameWidth / virtualWidth) : 1;

  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h4 className="text-sm font-bold text-neutral-900">Preview Beranda</h4>
        <div className="flex gap-1 rounded-full bg-neutral-100 p-1" role="tablist" aria-label="Ukuran perangkat preview">
          {(Object.keys(DEVICES) as Device[]).map((key) => {
            const { label, Icon } = DEVICES[key];
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={device === key}
                onClick={() => setDevice(key)}
                className={cn(
                  "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                  device === key ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500"
                )}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Kerangka: lebar mengikuti panel; tinggi = tinggi banner × skala. */}
      <div
        ref={frameRef}
        className="relative w-full overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100"
        style={{ height: innerHeight * scale || undefined }}
      >
        <div
          ref={innerRef}
          className="absolute left-0 top-0 origin-top-left"
          style={{ width: virtualWidth, transform: `scale(${scale})` }}
        >
          <PromoBannerView banner={banner} />
        </div>
      </div>
      <p className="mt-1 text-xs text-neutral-500">
        Perkiraan tampilan di Beranda ({virtualWidth}px). Berubah langsung saat kamu mengisi form.
      </p>
    </div>
  );
}
