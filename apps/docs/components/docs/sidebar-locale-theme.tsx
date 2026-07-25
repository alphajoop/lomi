/* @proprietary license */

'use client';

import { useRouter } from 'next/navigation';
import { ChevronDown, Languages } from 'lucide-react';
import { ThemeSwitch } from 'fumadocs-ui/layouts/shared/slots/theme-switch';
import { languages, type Language } from '@/lib/i18n/config';
import { useTranslation } from '@/lib/utils/translation-context';
import { cn } from '@/lib/utils/cn';

/** Consistent with sidebar control radius in this app */
const r = 'rounded-[0.3rem]';

/**
 * Sits in the Fumadocs sidebar bottom bar (`border bg-fd-secondary/50`).
 * The default ThemeSwitch includes its own `border`, which reads as a double box;
 * we drop that and match the bar’s single outline.
 */
export function DocsSidebarLocaleAndTheme({
  className,
}: {
  /** Passed through from Fumadocs sidebar (e.g. `ms-auto`). */
  className?: string;
}) {
  const router = useRouter();
  const { currentLanguage, setLanguage } = useTranslation();

  return (
    <div
      className={cn(
        'inline-flex w-max max-w-full min-w-0 items-center',
        className,
      )}
      data-sidebar-locale-theme
    >
      <div className="flex min-w-0 max-w-full items-center gap-2">
        <label
          className={cn(
            'relative flex h-7 min-w-0 max-w-34 cursor-pointer items-center gap-1.5',
            r,
            'px-2 text-fd-muted-foreground transition-colors',
            'hover:bg-fd-accent/30',
          )}
        >
          <Languages className="size-3.5 shrink-0 opacity-90" aria-hidden />
          <span className="sr-only">Documentation language</span>
          <select
            aria-label="Documentation language"
            className={cn(
              r,
              'h-full min-w-0 max-w-24 cursor-pointer appearance-none bg-transparent pe-4 text-left text-xs',
              'text-fd-muted-foreground outline-none',
              'focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none',
            )}
            value={currentLanguage}
            onChange={(e) => {
              const lang = e.target.value as Language;
              setLanguage(lang);
              router.refresh();
            }}
          >
            {languages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute inset-e-1.5 top-1/2 size-3.5 -translate-y-1/2 text-fd-muted-foreground/70"
            aria-hidden
          />
        </label>

        <div
          role="separator"
          aria-orientation="vertical"
          className="h-4 w-px shrink-0 bg-fd-border/80"
        />

        <ThemeSwitch
          className={cn(
            'shrink-0 self-center p-0.5',
            'border-0! border-none! bg-transparent! shadow-none!',
            'outline-none! focus-visible:ring-0! focus-visible:outline-none! active:ring-0!',
            'overflow-hidden rounded-[0.3rem]! *:rounded-[0.3rem]!',
          )}
          mode="light-dark"
        />
      </div>
    </div>
  );
}
