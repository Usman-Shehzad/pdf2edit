import type { MetadataRoute } from 'next';
import { TOOLS } from '@/lib/tools/registry';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf2edit.example';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/`, priority: 1 },
    { url: `${BASE}/edit`, priority: 0.9 },
    ...TOOLS.map((t) => ({ url: `${BASE}/tools/${t.slug}`, priority: 0.8 })),
  ];
}
