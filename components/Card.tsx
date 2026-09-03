'use client';

import { cn } from '@/lib/utils';
import { Group } from 'react-aria-components';

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return (
    <Group className={cn('bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden block', className)}>
      {children}
    </Group>
  );
}

export function StatCard({
  title,
  shortTitle,
  value,
  variant = 'default'
}: {
  title: string;
  shortTitle?: string;
  value: string | number;
  variant?: 'default' | 'danger';
}) {
  return (
    <Group className={cn(
      'bg-card/50 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm border border-card-header/45 transition-all',
      'flex flex-col items-center justify-center text-center sm:block sm:text-left',
      'hover:shadow-md hover:border-card-header',
      variant === 'danger' && 'border-red-200 bg-red-50/50'
    )}>
      <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-text-muted mb-0.5 sm:mb-1 leading-tight">
        {shortTitle ? (
          <>
            <span className="sm:hidden">{shortTitle}</span>
            <span className="hidden sm:inline">{title}</span>
          </>
        ) : (
          title
        )}
      </p>
      <p className={cn(
        'text-2xl sm:text-3xl font-extrabold text-primary leading-none sm:mt-1',
        variant === 'danger' && 'text-red-700'
      )}>
        {value}
      </p>
    </Group>
  );
}
