import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { PairedProduct } from "@/services/productService";
import { formatCurrency } from "@/utils/formatCurrency";
import { ROUTES } from "@/constants/routes";

/**
 * "Pasangan Produk" di halaman Detail Produk — diambil dari relasi product_pairs
 * sungguhan (diatur admin lewat SKU di Admin > Produk), bukan lagi produk
 * sekategori sebagai pendekatan sementara.
 */
export function PairedProductsSection({ pairs }: { pairs: PairedProduct[] }) {
  if (pairs.length === 0) return null;

  return (
    <Container className="py-14">
      <h2 className="mb-6 text-xl font-bold text-neutral-900">Pasangan Produk</h2>
      <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
        {pairs.map((p) => (
          <Link key={p.id} href={ROUTES.produkDetail(p.slug)} className="group block">
            <div className="relative mb-3 aspect-[3/4] overflow-hidden rounded-lg bg-neutral-50">
              {p.imageUrl && (
                <Image
                  src={p.imageUrl}
                  alt={p.namaProduk}
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              )}
            </div>
            <p className="mb-1 text-sm text-neutral-800">{p.namaProduk}</p>
            <p className="text-sm font-semibold text-neutral-900">{formatCurrency(p.harga)}</p>
          </Link>
        ))}
      </div>
    </Container>
  );
}
