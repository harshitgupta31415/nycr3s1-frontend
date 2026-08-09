import type { MetadataRoute } from "next";

const siteUrl = process.env.SITE_URL ?? "https://dbsentinal.get200.qd.je";
const routes = ["", "/product", "/simulation", "/architecture", "/reports"];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    changeFrequency: "weekly",
    priority: route ? 0.7 : 1,
  }));
}
