'use client';

import { cn } from '@/lib/utils';
import { Bell } from 'lucide-react';

interface StatusBarProps {
  className?: string;
}

export function StatusBar({ className }: StatusBarProps) {
  return (
    <footer
      className={cn(
        'flex h-7 items-center justify-between border-t px-4 text-[11px]',
        className
      )}
      style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-elevated)' }}
    >
      {/* Left section */}
      <div className="flex items-center gap-4">
        <span className="text-muted-foreground">
          Leveron CRM <span style={{ color: 'var(--accent-gold)' }}>Imobiliarias</span>
        </span>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4">
        <NotificationBadge count={0} />
      </div>
    </footer>
  );
}

interface NotificationBadgeProps {
  count: number;
}

function NotificationBadge({ count }: NotificationBadgeProps) {
  return (
    <button
      className={cn(
        'relative flex items-center justify-center rounded-md p-1',
        'text-muted-foreground hover:bg-accent hover:text-foreground',
        'transition-colors'
      )}
      title={`${count} notifications`}
    >
      <Bell className="h-4 w-4" />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}
