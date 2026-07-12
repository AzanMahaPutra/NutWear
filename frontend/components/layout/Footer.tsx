import Link from "next/link";
import { Instagram, Facebook, Youtube } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import { ROUTES } from "@/constants/routes";
import { categoryService } from "@/services/categoryService";

const SUPPORT_LINKS = [
  { label: "Tentang Kami", href: ROUTES.tentangKami },
  { label: "FAQ", href: `${ROUTES.pelayananDukungan}#faq` },
  { label: "Hubungi Kami", href: `${ROUTES.pelayananDukungan}#hubungi-kami` },
  { label: "Kebijakan Pengembalian", href: `${ROUTES.pelayananDukungan}#kebijakan-pengembalian` },
  { label: "Panduan Ukuran", href: `${ROUTES.pelayananDukungan}#panduan-ukuran` },
  { label: "Syarat & Ketentuan", href: `${ROUTES.pelayananDukungan}#syarat-ketentuan` },
];

/**
 * Footer global dipakai lewat MainLayout di seluruh halaman shop/profile.
 * Server Component: daftar kategori diambil langsung dari Category API supaya
 * kolom "Kategori Toko" selalu mengikuti data kategori terbaru di database
 * (bukan daftar statis lagi). Tiap kategori mengarah ke halaman Produk dengan
 * filter kategori tersebut langsung aktif.
 */
export async function Footer() {
  const year = new Date().getFullYear();
  const categories = await categoryService.getAll().catch(() => []);

  const kategoriLinks = [
    { label: "New Arrivals", href: ROUTES.produkNewArrival },
    ...categories.map((c) => ({ label: c.namaKategori, href: ROUTES.produkKategori(c.id) })),
  ];

  return (
    <footer className="bg-neutral-900 pt-14 text-neutral-300">
      <Container className="grid grid-cols-1 gap-10 pb-10 md:grid-cols-3">
        <div>
          <Logo invert />
          <p className="mt-4 text-sm leading-relaxed text-neutral-400">
            Pakaian harian untuk cerita harianmu. Temukan koleksi pakaian wanita dan pria eksklusif kami.
          </p>
          <div className="mt-4 flex items-center gap-4">
            <Instagram className="h-4 w-4" />
            <Facebook className="h-4 w-4" />
            <Youtube className="h-4 w-4" />
          </div>
        </div>

        <div>
          <h3 className="mb-3 font-semibold text-white">Kategori Toko</h3>
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm sm:block sm:space-y-2">
            {kategoriLinks.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="text-amber-400/80 transition-colors hover:text-amber-300">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 font-semibold text-white">Pelayanan & Dukungan</h3>
          <ul className="space-y-2 text-sm">
            {SUPPORT_LINKS.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="text-amber-400/80 transition-colors hover:text-amber-300">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

      </Container>

      <div className="border-t border-white/10 py-5 text-center text-xs text-neutral-400">
        &copy;{year} NutWear THREADS Semua Hak Dilindungi | Kebijakan Privasi | Syarat Penggunaan
      </div>
    </footer>
  );
}
