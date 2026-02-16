import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://viotraix.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/new-audit/", "/audits/", "/settings/", "/billing/", "/usage/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
