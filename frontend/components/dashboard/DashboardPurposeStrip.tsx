import Link from 'next/link'

type PurposeVariant = 'operacao-ao-vivo' | 'inteligencia-relatorios' | 'inteligencia-crm'

const VARIANT: Record<
  PurposeVariant,
  { accent: string; accentMuted: string; tag: string }
> = {
  'operacao-ao-vivo': {
    accent: '#059669',
    accentMuted: 'rgba(5, 150, 105, 0.12)',
    tag: 'Tempo real',
  },
  'inteligencia-relatorios': {
    accent: '#6366f1',
    accentMuted: 'rgba(99, 102, 241, 0.12)',
    tag: 'Histórico consolidado',
  },
  'inteligencia-crm': {
    accent: '#c026d3',
    accentMuted: 'rgba(192, 38, 211, 0.1)',
    tag: 'Por pessoa',
  },
}

export function DashboardPurposeStrip({
  variant,
  title,
  description,
  footerLink,
}: {
  variant: PurposeVariant
  title: string
  description: string
  footerLink?: { href: string; label: string }
}) {
  const v = VARIANT[variant]
  return (
    <div
      className="rounded-2xl border px-4 py-3.5 anim-up"
      style={{
        borderLeftWidth: 4,
        borderLeftColor: v.accent,
        background: v.accentMuted,
        borderColor: 'var(--border)',
      }}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <span
            className="inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            style={{ background: 'var(--bg-raised)', color: v.accent, border: `1px solid ${v.accent}33` }}
          >
            {v.tag}
          </span>
          <p className="mt-2 text-sm font-bold leading-snug sm:text-base" style={{ color: 'var(--text-1)' }}>
            {title}
          </p>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed sm:text-sm" style={{ color: 'var(--text-2)' }}>
            {description}
          </p>
          {footerLink && (
            <Link
              href={footerLink.href}
              className="mt-3 inline-flex text-xs font-semibold transition-opacity hover:opacity-90"
              style={{ color: v.accent }}
            >
              {footerLink.label}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
