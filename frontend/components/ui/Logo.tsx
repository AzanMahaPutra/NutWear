import Link from "next/link";
import { PenTool } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/utils/cn";

interface LogoProps {
  className?: string;
  invert?: boolean; // untuk versi di footer (background gelap)
}

/**
 * Logo NutWear reusable dipakai di Navbar, Footer, dan halaman Login.
 * Sementara menggunakan ikon placeholder sampai aset logo asli tersedia.
 */
export function Logo({ className, invert = false }: LogoProps) {
  return (
    <Link
      href={ROUTES.home}
      className={cn(
        "flex items-center gap-2 text-xl font-extrabold tracking-tight",
        invert ? "text-white" : "text-neutral-900",
        className
      )}
    >
      <PenTool className="h-5 w-5 rotate-90" strokeWidth={2.5} />
      <span>
        Nut<span className={invert ? "text-white/60" : "text-neutral-400"}>Wear</span>
      </span>
    </Link>
  );
}
