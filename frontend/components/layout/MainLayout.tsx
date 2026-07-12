import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

/**
 * Layout reusable untuk semua halaman publik (shop) & profile.
 * Navbar membaca cart/wishlist count langsung dari store masing-masing
 * (client component), jadi tidak perlu di-passing lewat props di sini.
 */
export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="min-h-[60vh]">{children}</main>
      <Footer />
    </>
  );
}
