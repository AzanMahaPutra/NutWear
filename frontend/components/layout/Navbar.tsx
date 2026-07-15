"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal, Heart, ShoppingCart, User, ImageOff } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import { IconLink } from "@/components/ui/IconLink";
import { NavbarCategoryMenu } from "@/components/layout/NavbarCategoryMenu";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { ROUTES } from "@/constants/routes";
import { useCartStore } from "@/stores/cartStore";
import { useWishlistStore } from "@/stores/wishlistStore";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { productService } from "@/services/productService";
import { formatCurrency } from "@/utils/formatCurrency";
import { Product } from "@/types/product";

const NAV_LINKS = [
  { label: "Beranda", href: ROUTES.home },
  { label: "Produk", href: ROUTES.produk },
];

/**
 * Navbar global: logo, search bar dengan debounced live-suggestion (memanggil
 * Product API setelah user berhenti mengetik ~400ms, bukan di setiap keystroke),
 * ikon wishlist/cart/profile (badge count live dari store), dan nav utama.
 */
export function Navbar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebouncedValue(query, 400);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const cartItems = useCartStore((s) => s.items);
  const wishlistItems = useWishlistStore((s) => s.items);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);
  const fetchUnreadCount = useNotificationStore((s) => s.fetchUnreadCount);
  const startPolling = useNotificationStore((s) => s.startPolling);
  const stopPolling = useNotificationStore((s) => s.stopPolling);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
      fetchWishlist();
      fetchUnreadCount();
      startPolling();
    } else {
      stopPolling();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Debounced live-suggestion: hanya memanggil Product API setelah user berhenti mengetik.
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    setIsSearching(true);
    productService
      .getAll({ search: debouncedQuery, pageSize: 5 })
      .then(({ items }) => {
        if (!cancelled) setSuggestions(items);
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      })
      .finally(() => {
        if (!cancelled) setIsSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function goToSearchResults() {
    setShowSuggestions(false);
    router.push(query ? `${ROUTES.produk}?search=${encodeURIComponent(query)}` : ROUTES.produk);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    goToSearchResults();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-100 bg-white">
      <Container className="flex items-center gap-6 py-4">
        <Logo />

        <div ref={searchBoxRef} className="relative hidden flex-1 md:block">
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center rounded-full border border-neutral-200 px-4 py-2.5"
          >
            <Search className="h-4 w-4 shrink-0 text-neutral-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Search..."
              className="ml-3 w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
            />
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-neutral-300" />
          </form>

          {showSuggestions && query.trim() && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-lg border border-neutral-100 bg-white shadow-lg">
              {isSearching ? (
                <p className="p-4 text-sm text-neutral-400">Mencari...</p>
              ) : suggestions.length === 0 ? (
                <p className="p-4 text-sm text-neutral-400">Tidak ada produk ditemukan</p>
              ) : (
                <>
                  {suggestions.map((product) => {
                    const cover = product.images[0]?.imageUrl;
                    return (
                      <Link
                        key={product.id}
                        href={ROUTES.produkDetail(product.slug)}
                        onClick={() => setShowSuggestions(false)}
                        className="flex items-center gap-3 border-b border-neutral-50 px-4 py-2.5 last:border-0 hover:bg-neutral-50"
                      >
                        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-neutral-50">
                          {cover ? (
                            <Image src={cover} alt={product.namaProduk} fill sizes="40px" className="object-cover" />
                          ) : (
                            <ImageOff className="h-4 w-4 text-neutral-300" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-neutral-800">{product.namaProduk}</p>
                          <p className="text-xs text-neutral-500">{formatCurrency(product.harga)}</p>
                        </div>
                      </Link>
                    );
                  })}
                  <button
                    type="button"
                    onClick={goToSearchResults}
                    className="block w-full px-4 py-2.5 text-center text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                  >
                    Lihat semua hasil untuk &quot;{query}&quot;
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <IconLink
            href={ROUTES.wishlist}
            aria-label="Wishlist"
            badgeCount={wishlistItems.length}
            className="hidden sm:flex"
          >
            <Heart className="h-5 w-5" />
          </IconLink>
          <IconLink href={ROUTES.keranjang} aria-label="Keranjang" badgeCount={cartItems.length}>
            <ShoppingCart className="h-5 w-5" />
          </IconLink>
          {isAuthenticated && <NotificationBell />}
          <IconLink href={isAuthenticated ? ROUTES.profile : ROUTES.login} aria-label="Akun">
            <User className="h-5 w-5" />
          </IconLink>
        </div>
      </Container>

      <Container className="hidden items-center justify-center gap-8 pb-4 text-sm font-medium text-neutral-600 md:flex">
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="transition-colors hover:text-neutral-900">
            {link.label}
          </Link>
        ))}
        <NavbarCategoryMenu variant="desktop" />
      </Container>

      <Container className="flex flex-col gap-3 border-t border-neutral-100 py-3 md:hidden">
        <form
          onSubmit={handleSearchSubmit}
          className="flex items-center rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 focus-within:border-neutral-300 focus-within:bg-white"
        >
          <Search className="h-4 w-4 shrink-0 text-neutral-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari produk..."
            className="ml-3 w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
          />
        </form>

        <div className="flex divide-x divide-neutral-100 rounded-lg border border-neutral-100 text-sm font-semibold text-neutral-900">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="flex-1 py-2.5 text-center transition-colors hover:text-neutral-600">
              {link.label}
            </Link>
          ))}
        </div>

        <NavbarCategoryMenu variant="mobile" />
      </Container>
    </header>
  );
}
