'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const OUTBOUND_TABS = [
  { href: '/outbound', label: 'Overview' },
  { href: '/outbound/leads', label: 'Leads' },
  { href: '/outbound/cadences', label: 'Cadences' },
  { href: '/outbound/domains', label: 'Domains' },
]

interface OutboundLayoutProps {
  children: React.ReactNode
}

export default function OutboundLayout({ children }: OutboundLayoutProps) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col">
      {/* Sub-navigation tabs */}
      <div
        className="mb-4 flex gap-1 border-b pb-2"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        {OUTBOUND_TABS.map((tab) => {
          const isActive = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-luxury',
              )}
              style={{
                backgroundColor: isActive ? 'var(--accent-gold-bg)' : 'transparent',
                color: isActive ? 'var(--accent-gold)' : 'var(--text-muted)',
              }}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}
