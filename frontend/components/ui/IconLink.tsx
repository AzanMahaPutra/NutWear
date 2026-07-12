import Link from "next/link";
import { cn } from "@/utils/cn";

interface IconLinkProps {
  href: string;
  children: React.ReactNode;
  badgeCount?: number;
  className?: string;
  "aria-label"?: string;
}

/**
 * Ikon navigasi reusable (bukan tombol aksi) dengan opsi badge angka.
 * Dipakai untuk Wishlist, Cart, dan Akun di Navbar.
 */
export function IconLink({ href, children, badgeCount, className, ...props }: IconLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "relative flex h-9 w-9 items-center justify-center rounded-full text-neutral-800 transition-colors hover:bg-neutral-100",
        className
      )}
      {...props}
    >
      {children}
      {typeof badgeCount === "number" && badgeCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-neutral-900 px-1 text-[10px] font-semibold text-white">
          {badgeCount > 99 ? "99+" : badgeCount}
        </span>
      )}
    </Link>
  );
}
