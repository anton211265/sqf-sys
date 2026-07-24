import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from 'lib/utils';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  /** Tailwind width classes; spec default is a 40%-width drawer. */
  widthClassName?: string;
}

/** Right-hand slide-out drawer (User Assignment Drawer, audit context). */
export function Sheet({
  open,
  onOpenChange,
  children,
  widthClassName = 'w-full max-w-xl lg:w-[40%]',
}: SheetProps) {
  React.useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => onOpenChange(false)}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'absolute right-0 top-0 flex h-full flex-col overflow-y-auto border-l bg-background p-6 shadow-xl',
          widthClassName,
        )}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}
