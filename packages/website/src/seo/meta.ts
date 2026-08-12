export interface RouteMeta {
  title: string;
  description: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterImage?: string;
  canonical: string;
  hreflang?: { en: string; id: string };
}

const SITE_URL = "https://hvsna.com";

export const DEFAULT_META: RouteMeta = {
  title: "Hvsna - Islamic Todo App | Organize Your Day, the Islamic Way",
  description:
    "Prayer-first task app with Hijri calendar awareness. Features offline-first design, focused UI, and supports both mobile and desktop for Muslim productivity.",
  keywords: "Islamic todo app, Hijri calendar, prayer times, Muslim productivity, task management, offline app",
  ogImage: `${SITE_URL}/og-image.jpg`,
  twitterImage: `${SITE_URL}/twitter-image.jpg`,
  canonical: `${SITE_URL}/`,
};

export const ROUTE_META: Record<string, RouteMeta> = {
  "/": {
    ...DEFAULT_META,
    ogTitle: "Hvsna - Islamic Todo App",
    ogDescription: "Organize Your Day, the Islamic Way. Prayer-first task app with Hijri calendar awareness.",
    canonical: `${SITE_URL}/`,
    hreflang: { en: "/", id: "/id" },
  },
  "/id": {
    title: "Hvsna - Aplikasi Todo Islam | Atur Harimu, Cara Islami",
    description:
      "Aplikasi task berbasis sholat dengan dukungan kalender Hijriah. Fitur desain offline-pertama, UI fokus, dan mendukung mobile serta desktop untuk produktivitas Muslim.",
    keywords: "aplikasi todo Islam, kalender Hijri, waktu sholat, produktivitas Muslim, manajemen tugas, aplikasi offline",
    ogTitle: "Hvsna - Aplikasi Produkfitas Islam",
    ogDescription: "Atur Harimu, Cara Islami. Aplikasi task berbasis sholat dengan kalender Hijriah.",
    ogImage: `${SITE_URL}/og-image-id.jpg`,
    twitterImage: `${SITE_URL}/twitter-image-id.jpg`,
    canonical: `${SITE_URL}/id`,
    hreflang: { en: "/", id: "/id" },
  },
};

export function getRouteMeta(pathname: string): RouteMeta {
  return ROUTE_META[pathname] ?? { ...DEFAULT_META, canonical: `${SITE_URL}${pathname}` };
}
