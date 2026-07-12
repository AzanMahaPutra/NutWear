import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { ProductDetailInteractive } from "@/features/product/components/ProductDetailInteractive";
import { ProductDescription } from "@/features/product/components/ProductDescription";
import { ProductReviewsSection } from "@/features/review/components/ProductReviewsSection";
import { RelatedProducts } from "@/features/product/components/RelatedProducts";
import { productService } from "@/services/productService";
import { reviewService } from "@/services/reviewService";
import { enrichProduct } from "@/utils/enrichProduct";

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

async function safeGetProductBySlug(slug: string) {
  try {
    return await productService.getBySlug(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await safeGetProductBySlug(slug);
  if (!product) return { title: "Produk tidak ditemukan" };

  const cover = product.images[0]?.imageUrl;

  return {
    title: product.namaProduk,
    description: product.deskripsi?.slice(0, 150),
    openGraph: {
      title: product.namaProduk,
      description: product.deskripsi?.slice(0, 150),
      images: cover ? [{ url: cover }] : undefined,
      type: "website",
    },
  };
}

/**
 * UPDATE 3 — "Pasangan Produk" sekarang diatur per foto Gallery Produk, bukan
 * lagi satu daftar untuk keseluruhan produk. Aksesnya lewat icon kecil pada
 * foto gallery yang punya pasangan (lihat ProductGallery/ProductMainPhoto),
 * yang membuka halaman /produk/[slug]/pasangan?imageId=... Related Product
 * tetap menampilkan produk lain di kategori yang sama seperti sebelumnya.
 */
export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const rawProduct = await safeGetProductBySlug(slug);

  if (!rawProduct) notFound();

  const product = enrichProduct(rawProduct);

  const [reviewData, relatedResult] = await Promise.all([
    reviewService.getByProduct(product.id).catch(() => ({ items: [], summary: { average: 0, count: 0 } })),
    productService.getAll({ categoryId: product.kategoriId, pageSize: 5 }).catch(() => ({ items: [], meta: null })),
  ]);

  const productWithRating = {
    ...product,
    rating: reviewData.summary.average,
    reviewCount: reviewData.summary.count,
  };

  const related = relatedResult.items.filter((p) => p.id !== product.id);

  return (
    <>
      <Container className="grid grid-cols-1 gap-10 py-8 lg:grid-cols-2">
        <ProductDetailInteractive product={productWithRating} />
      </Container>

      <Container>
        <ProductDescription product={product} />
        <ProductReviewsSection product={product} reviews={reviewData.items} />
      </Container>

      <RelatedProducts products={related} />
    </>
  );
}
