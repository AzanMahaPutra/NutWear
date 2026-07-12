"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

/**
 * Item accordion reusable — dipakai untuk Fitur/Detail/Material/Pengiriman di Detail Produk,
 * dan bisa dipakai ulang di FAQ atau halaman Tentang Kami.
 */
export function AccordionItem({ title, children, defaultOpen = false }: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-neutral-200 py-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left text-sm font-medium text-neutral-900"
      >
        {title}
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && <div className="mt-3 text-sm text-neutral-600">{children}</div>}
    </div>
  );
}
