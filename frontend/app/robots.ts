import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nutwear.example.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/checkout", "/profile"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
