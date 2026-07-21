// ============================================================================
// ROBOTS.TXT (Website Factory Framework)
//
// Patterns:
//   - Allow all public pages
//   - Disallow /dashboard (auth-protected), /login, /api (data endpoints)
//   - Sitemap URL should match metadataBase in layout.tsx
// ============================================================================

import type { MetadataRoute } from "next";
import { getPublicBaseUrl } from "@/lib/public-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/login", "/api"],
      },
    ],
    sitemap: `${getPublicBaseUrl()}/sitemap.xml`,
  };
}
