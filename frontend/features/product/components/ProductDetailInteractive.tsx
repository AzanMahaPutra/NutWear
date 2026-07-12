"use client";

import { useState } from "react";
import { Product } from "@/types/product";
import { ProductGallery } from "@/features/product/components/ProductGallery";
import { ProductPurchasePanel } from "@/features/product/components/ProductPurchasePanel";

/**
 * Menyatukan galeri foto (grid 2 kolom, foto utama berubah sesuai warna) di kolom
 * kiri, dengan panel pembelian (pemilih warna) di kolom kanan — keduanya perlu
 * berbagi state `selectedColor` yang sama, jadi diangkat ke sini.
 */
export function ProductDetailInteractive({ product }: { product: Product }) {
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0]?.code ?? "");

  return (
    <>
      <ProductGallery
        images={product.images}
        productName={product.namaProduk}
        productSlug={product.slug}
        selectedColor={selectedColor}
      />
      <ProductPurchasePanel product={product} selectedColor={selectedColor} onSelectColor={setSelectedColor} />
    </>
  );
}
