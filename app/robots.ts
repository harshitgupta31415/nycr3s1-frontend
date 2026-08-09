import type { MetadataRoute } from "next";

const siteUrl = process.env.SITE_URL ?? "https://dbsentinal.get200.qd.je";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
