import Link from 'next/link';
import { TOOLS } from '@/lib/tools/registry';

export function SiteHeader() {
  return (
    <header className="glass sticky top-0 z-20 border-b border-slate-200/60">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="PDF2Edit logo" className="w-10 h-10 object-contain drop-shadow" />
          <span className="font-extrabold text-lg tracking-tight text-slate-900">
            PDF<span className="text-gradient">2Edit</span>
          </span>
        </Link>
        <nav aria-label="Tools" className="hidden md:flex items-center gap-1 text-sm font-semibold text-slate-600">
          {TOOLS.slice(0, 4).map((t) => (
            <Link key={t.slug} href={`/tools/${t.slug}`} className="px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors">
              {t.name}
            </Link>
          ))}
          <Link href="/edit" className="ml-2 px-4 py-2 rounded-xl bg-linear-to-r from-blue-700 to-blue-500 text-white shadow-md shadow-blue-600/25 hover:brightness-110 transition">
            Edit &amp; Sign
          </Link>
        </nav>
        <Link href="/edit" className="md:hidden px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold">
          Edit &amp; Sign
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200/70 bg-white/60 mt-16">
      <div className="max-w-6xl mx-auto px-5 py-10 grid sm:grid-cols-3 gap-8 text-sm">
        <div>
          <p className="font-extrabold text-slate-900 mb-2">PDF2Edit</p>
          <p className="text-slate-500 leading-relaxed">Private PDF tools that run in your browser. No uploads, no sign-up, no tracking.</p>
        </div>
        <div>
          <p className="font-bold text-slate-900 mb-2">Tools</p>
          <ul className="space-y-1.5 text-slate-500">
            {TOOLS.map((t) => (
              <li key={t.slug}><Link className="hover:text-blue-600" href={`/tools/${t.slug}`}>{t.name}</Link></li>
            ))}
            <li><Link className="hover:text-blue-600" href="/edit">Edit &amp; Sign PDF</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-bold text-slate-900 mb-2">Privacy</p>
          <p className="text-slate-500 leading-relaxed">Your files are processed in your device&apos;s memory and are never sent to a server.</p>
        </div>
      </div>
    </footer>
  );
}
