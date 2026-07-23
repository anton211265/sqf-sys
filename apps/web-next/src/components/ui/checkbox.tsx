import * as React from 'react';
import { Check, Minus } from 'lucide-react';
import { cn } from 'lib/utils';

interface CheckboxProps {
  checked: boolean;
  /** Renders a dash instead of a check — "some but not all" (Select All). */
  indeterminate?: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  'aria-label'?: string;
}

/**
 * Dependency-free controlled checkbox in the shadcn idiom (button with
 * role=checkbox), so the permission matrix doesn't need Radix primitives
 * yet — swap for @radix-ui/react-checkbox when the design-token pass adds
 * the full shadcn set.
 */
export function Checkbox({
  checked,
  indeterminate = false,
  disabled = false,
  onCheckedChange,
  className,
  ...rest
}: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary transition-colors',
        (checked || indeterminate) && 'bg-primary text-primary-foreground',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
      {...rest}
    >
      {indeterminate ? (
        <Minus className="h-3 w-3" />
      ) : checked ? (
        <Check className="h-3 w-3" />
      ) : null}
    </button>
  );
}
