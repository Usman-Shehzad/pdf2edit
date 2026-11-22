import { Combine, Scissors, Minimize2, FileImage, Images, Unlock, PenTool, RotateCw, Trash2, Hash, Droplets, FileText, type LucideIcon } from 'lucide-react';
import type { ToolSlug } from '@/lib/tools/registry';

const ICONS: Record<ToolSlug | 'edit', LucideIcon> = {
  'merge-pdf': Combine,
  'split-pdf': Scissors,
  'compress-pdf': Minimize2,
  'pdf-to-jpg': FileImage,
  'jpg-to-pdf': Images,
  'unlock-pdf': Unlock,
  'rotate-pdf': RotateCw,
  'delete-pdf-pages': Trash2,
  'add-page-numbers': Hash,
  'watermark-pdf': Droplets,
  'pdf-to-text': FileText,
  edit: PenTool,
};

export function ToolIcon({ slug, className }: { slug: ToolSlug | 'edit'; className?: string }) {
  const Icon = ICONS[slug];
  return <Icon className={className} />;
}
