import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/new-audit/", "/audits/", "/settings/", "/billing/", "/usage/"],
      },
    ],
    sitemap: "https://viotraix.vercel.app/sitemap.xml",
  };
}
