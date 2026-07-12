import { create } from "zustand";
import { WishlistItem } from "@/types/user";
import { wishlistService, WishlistApiItem } from "@/services/wishlistService";

function toWishlistItem(raw: WishlistApiItem): WishlistItem {
  return {
    id: raw.id,
    productId: raw.productId,
    namaProduk: raw.namaProduk,
    slug: raw.slug,
    imageUrl: raw.imageUrl,
    harga: raw.harga,
    hargaPromo: raw.hargaPromo,
    hargaPromoColor: raw.hargaPromoColor,
    isPromoActive: raw.isPromoActive,
  };
}

interface WishlistState {
  items: WishlistItem[];
  isLoading: boolean;
  fetchWishlist: () => Promise<void>;
  addItem: (productId: string) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
  toggleItem: (productId: string) => Promise<void>;
}

/**
 * Store wishlist global, sinkron dengan Wishlist API sungguhan.
 */
export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  isLoading: false,

  fetchWishlist: async () => {
    set({ isLoading: true });
    try {
      const raw = await wishlistService.getAll();
      set({ items: raw.map(toWishlistItem) });
    } finally {
      set({ isLoading: false });
    }
  },

  addItem: async (productId) => {
    if (get().isWishlisted(productId)) return;
    await wishlistService.add(productId);
    await get().fetchWishlist();
  },

  removeItem: async (productId) => {
    await wishlistService.remove(productId);
    set((state) => ({ items: state.items.filter((i) => i.productId !== productId) }));
  },

  isWishlisted: (productId) => get().items.some((i) => i.productId === productId),

  toggleItem: async (productId) => {
    if (get().isWishlisted(productId)) {
      await get().removeItem(productId);
    } else {
      await get().addItem(productId);
    }
  },
}));
