import * as React from 'react';

export interface UsageMeterItem {
  label: string;
  used: number;
  limit: number;
  unit?: string;
}

export interface UsageMeterProps {
  items: UsageMeterItem[];
  title?: string;
  description?: string;
  className?: string;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function usageTone(percent: number) {
  if (percent >= 90) return 'bg-destructive';
  if (percent >= 75) return 'bg-amber-500';
  return 'bg-primary';
}

export function UsageMeter({
  items,
  title = 'Usage',
  description = 'Track payment and billing limits before customers hit them.',
  className,
}: UsageMeterProps) {
  return (
    <section
      className={cn(
        'w-full max-w-xl rounded-md border bg-card p-5 text-card-foreground shadow-sm',
        className,
      )}
    >
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-5 space-y-4">
        {items.map((item) => {
          const percent = Math.min(
            Math.round((item.used / item.limit) * 100),
            100,
          );
          return (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="font-medium">{item.label}</span>
                <span className="text-muted-foreground">
                  {item.used.toLocaleString()} / {item.limit.toLocaleString()}
                  {item.unit ? ` ${item.unit}` : ''}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    usageTone(percent),
                  )}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
