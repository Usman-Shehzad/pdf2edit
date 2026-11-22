import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TOOLS, getTool } from '@/lib/tools/registry';
import { SiteHeader, SiteFooter } from '@/components/site/SiteChrome';
import { ToolRunner } from '@/components/tools/ToolRunner';
import { ToolIcon } from '@/components/tools/ToolIcon';

export function generateStaticParams() {
  return TOOLS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const tool = getTool((await params).slug);
  if (!tool) return {};
  return {
    title: tool.title,
    description: tool.description,
    keywords: tool.keywords,
    alternates: { canonical: `/tools/${tool.slug}` },
    openGraph: { title: tool.title, description: tool.description, type: 'website' },
  };
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const tool = getTool((await params).slug);
  if (!tool) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: tool.name,
        description: tool.description,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Any (browser)',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
      {
        '@type': 'FAQPage',
        mainEntity: tool.faq.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  };
  const others = TOOLS.filter((t) => t.slug !== tool.slug);

  return (
    <div className="min-h-screen flex flex-col bg-aurora">
      <SiteHeader />
      <main className="flex-1 px-5 pt-12">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <div className="text-center max-w-2xl mx-auto mb-8 animate-rise">
          <div className={`w-14 h-14 mx-auto rounded-2xl bg-linear-to-br ${tool.tone} text-white flex items-center justify-center shadow-lg mb-4`}>
            <ToolIcon slug={tool.slug} className="w-7 h-7" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">{tool.title}</h1>
          <p className="mt-3 text-slate-600">{tool.description}</p>
        </div>

        <ToolRunner slug={tool.slug} accept={tool.accept} multiple={tool.multiple} />

        <section className="max-w-3xl mx-auto mt-16">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Frequently asked questions</h2>
          <div className="space-y-3">
            {tool.faq.map((f) => (
              <details key={f.q} className="group rounded-2xl bg-white/80 border border-slate-200 px-5 py-4">
                <summary className="cursor-pointer font-semibold text-slate-900 list-none flex justify-between">
                  {f.q}<span className="text-slate-400 group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="max-w-3xl mx-auto mt-12">
          <h2 className="text-xl font-bold text-slate-900 mb-4">More PDF tools</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {others.map((t) => (
              <Link key={t.slug} href={`/tools/${t.slug}`} className="flex items-center gap-3 p-3 rounded-xl bg-white/80 border border-slate-200 hover:shadow-md hover:-translate-y-0.5 transition-all">
                <span className={`w-9 h-9 rounded-lg bg-linear-to-br ${t.tone} text-white flex items-center justify-center`}><ToolIcon slug={t.slug} className="w-4 h-4" /></span>
                <span className="text-sm font-semibold text-slate-800">{t.name}</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
