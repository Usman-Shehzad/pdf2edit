import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Edit & Sign PDF Online – Free, Private, No Upload',
  description: 'Edit PDF text, sign, redact, annotate and reorganise pages directly in your browser. Files never leave your device.',
  alternates: { canonical: '/edit' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
