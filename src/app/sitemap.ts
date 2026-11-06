import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://buythecrypto.com";
  const paths = ["", "/buy-crypto", "/markets", "/cryptocurrencies", "/how-it-works", "/about", "/contact", "/faq", "/terms", "/privacy", "/risk-disclosure"];
  return paths.map((path) => ({ url: `${base}${path || "/"}`, changeFrequency: "daily", priority: path === "" ? 1 : 0.7 }));
}
