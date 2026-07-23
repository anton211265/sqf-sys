import * as React from 'react';
import { cn } from 'lib/utils';

// Shared status badge per the dashboard standard: traffic-light semantics
// always pair color with a text label, never color alone.
const variants = {
  default: 'bg-secondary text-secondary-foreground',
  blue: 'bg-sky-100 text-sky-800',
  green: 'bg-emerald-100 text-emerald-800',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-800',
  purple: 'bg-violet-100 text-violet-800',
  outline: 'border border-border text-foreground',
} as const;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variants;
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
