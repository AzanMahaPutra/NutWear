import type { Metadata } from "next";
import "./globals.css";
import { ToastContainer } from "@/components/shared/ToastContainer";
import { AuthProvider } from "@/components/shared/AuthProvider";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://nutwear.example.com"),
  title: {
    default: "NutWear | Pakaian Harian untuk Cerita Harianmu",
    template: "%s | NutWear",
  },
  description:
    "NutWear adalah destinasi fashion online untuk pakaian kasual minimalis dengan kualitas premium bagi pria dan wanita.",
  openGraph: {
    siteName: "NutWear",
    title: "NutWear",
    description: "Asia's Online Fashion Destination",
    type: "website",
    locale: "id_ID",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "NutWear",
    description: "Asia's Online Fashion Destination",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased font-sans">
        <AuthProvider>{children}</AuthProvider>
        <ToastContainer />
      </body>
    </html>
  );
}
