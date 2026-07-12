"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Container } from "@/components/ui/Container";

/**
 * Error boundary global Next.js (app/error.tsx). Menangkap error tak terduga
 * di Server/Client Component mana pun dalam tree, menampilkan Error State
 * yang ramah alih-alih layar putih kosong.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <AlertTriangle className="h-14 w-14 text-red-400" />
      <h1 className="text-2xl font-bold text-neutral-900">Terjadi Kesalahan</h1>
      <p className="max-w-md text-sm text-neutral-500">
        Maaf, sesuatu berjalan tidak semestinya. Silakan coba lagi, atau kembali beberapa saat lagi.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white"
      >
        Coba Lagi
      </button>
    </Container>
  );
}
