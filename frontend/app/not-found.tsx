import Link from "next/link";
import { Frown } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Container } from "@/components/ui/Container";
import { ROUTES } from "@/constants/routes";

export default function NotFound() {
  return (
    <MainLayout>
      <Container className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <Frown className="h-16 w-16 text-neutral-300" />
        <h1 className="text-3xl font-bold text-neutral-900">404 - Halaman Tidak Ditemukan</h1>
        <p className="max-w-md text-sm text-neutral-500">
          Halaman yang Anda cari tidak ada atau sudah dipindahkan.
        </p>
        <Link href={ROUTES.home} className="rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white">
          Kembali ke Beranda
        </Link>
      </Container>
    </MainLayout>
  );
}
