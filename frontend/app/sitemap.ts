import type { MetadataRoute } from "next";
import { productService } from "@/services/productService";
import { categoryService } from "@/services/categoryService";

/**
 * Sitemap dinamis — mengambil seluruh produk & kategori aktif dari API sungguhan
 * supaya mesin pencari bisa mengindeks halaman Detail Produk & Kategori terbaru
 * tanpa perlu build ulang manual setiap ada produk baru.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nutwear.example.com";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/produk`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/kategori`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/tentang-kami`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/login`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/register`, changeFrequency: "yearly", priority: 0.2 },
  ];

  let productRoutes: MetadataRoute.Sitemap = [];
  let categoryRoutes: MetadataRoute.Sitemap = [];

  try {
    const { items: products } = await productService.getAll({ pageSize: 1000 });
    productRoutes = products.map((p) => ({
      url: `${baseUrl}/produk/${p.slug}`,
      lastModified: p.createdAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch {
    productRoutes = [];
  }

  try {
    const categories = await categoryService.getAll();
    categoryRoutes = categories.map((c) => ({
      url: `${baseUrl}/kategori/${c.id}`,
      changeFrequency: "weekly",
      priority: 0.6,
    }));
  } catch {
    categoryRoutes = [];
  }

  return [...staticRoutes, ...productRoutes, ...categoryRoutes];
}
