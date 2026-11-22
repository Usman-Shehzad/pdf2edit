import Link from 'next/link';
import { ArrowRight, ShieldCheck, Zap, WifiOff } from 'lucide-react';
import { TOOLS } from '@/lib/tools/registry';
import { SiteHeader, SiteFooter } from '@/components/site/SiteChrome';
import { ToolIcon } from '@/components/tools/ToolIcon';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-aurora">
      <SiteHeader />
      <main className="flex-1 px-5 pt-14">
        <section className="max-w-4xl mx-auto text-center animate-rise">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.05]">
            Every PDF tool you need. <span className="text-gradient">Private by design.</span>
          </h1>
          <p className="mt-5 text-lg text-slate-600 max-w-2xl mx-auto">
            Edit, sign, merge, split, compress and convert PDFs right in your browser. Your files never leave your device.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm font-semibold text-slate-600">
            {[[ShieldCheck, 'No uploads'], [Zap, 'Instant, no waiting'], [WifiOff, 'Works offline']].map(([Icon, label]) => {
              const I = Icon as typeof ShieldCheck;
              return (
                <span key={label as string} className="inline-flex items-center gap-1.5 rounded-full bg-white/80 border border-slate-200 px-3 py-1.5">
                  <I className="w-4 h-4 text-blue-600" /> {label as string}
                </span>
              );
            })}
          </div>
        </section>

        <section className="max-w-6xl mx-auto mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-label="PDF tools">
          <Link href="/edit" className="sm:col-span-2 lg:col-span-3 group relative overflow-hidden rounded-3xl bg-linear-to-r from-blue-700 via-blue-600 to-cyan-500 p-6 sm:p-8 text-white shadow-xl shadow-blue-600/25 hover:shadow-2xl transition-shadow">
            <div className="flex items-center gap-5">
              <span className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0"><ToolIcon slug="edit" className="w-7 h-7" /></span>
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-extrabold">Edit &amp; Sign PDF</h2>
                <p className="text-blue-50/90 text-sm sm:text-base mt-1">Click-to-edit text, signatures, real redaction, annotations and page organiser.</p>
              </div>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform hidden sm:block" />
            </div>
          </Link>

          {TOOLS.map((t, i) => (
            <Link
              key={t.slug}
              href={`/tools/${t.slug}`}
              style={{ animationDelay: `${i * 60}ms` }}
              className="animate-rise group p-5 rounded-2xl bg-white/85 border border-slate-200/80 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <span className={`w-11 h-11 rounded-xl bg-linear-to-br ${t.tone} text-white flex items-center justify-center shadow-md mb-3`}>
                <ToolIcon slug={t.slug} className="w-5 h-5" />
              </span>
              <h2 className="font-bold text-slate-900">{t.name}</h2>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">{t.tagline}</p>
            </Link>
          ))}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
