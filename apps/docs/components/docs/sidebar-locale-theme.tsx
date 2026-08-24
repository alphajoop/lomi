/* @proprietary license */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronDown, Languages } from 'lucide-react';
import { ThemeSwitch } from 'fumadocs-ui/layouts/shared/slots/theme-switch';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'fumadocs-ui/components/ui/popover';
import { languages, type Language } from '@/lib/i18n/config';
import { useTranslation } from '@/lib/utils/translation-context';
import { t as translate } from '@/lib/i18n/translations';
import { cn } from '@lomi./ui/cn';

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
  const t = (key: string) => translate(key, currentLanguage);
  const [open, setOpen] = useState(false);

  const selected =
    languages.find((l) => l.code === currentLanguage) ?? languages[0];

  function choose(lang: Language) {
    setOpen(false);
    if (lang === currentLanguage) return;
    setLanguage(lang);
    router.refresh();
  }

  return (
    <div
      className={cn(
        'inline-flex w-max max-w-full min-w-0 items-center',
        className,
      )}
      data-sidebar-locale-theme
    >
      <div className="flex min-w-0 max-w-full items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            type="button"
            className={cn(
              'docs-locale-switch relative flex h-7 min-w-0 max-w-34 cursor-pointer items-center gap-1.5',
              r,
              'px-2 text-fd-muted-foreground transition-colors',
              'hover:bg-fd-accent/30',
              'outline-none focus:outline-none focus-visible:outline-none',
            )}
            aria-label={t('ui.chooseLanguage')}
          >
            <Languages className="size-3.5 shrink-0 opacity-90" aria-hidden />
            <span className="min-w-0 flex-1 truncate text-left text-xs">
              {selected.name}
            </span>
            <ChevronDown
              className="size-3.5 shrink-0 text-fd-muted-foreground/70"
              aria-hidden
            />
          </PopoverTrigger>
          <PopoverContent
            align="start"
            side="top"
            sideOffset={6}
            className="docs-locale-menu z-[80] flex w-(--radix-popover-trigger-width) min-w-44 flex-col gap-1 p-1 fd-scroll-container"
          >
            {languages.map((l) => {
              const isActive = l.code === currentLanguage;
              return (
                <button
                  key={l.code}
                  type="button"
                  className={cn(
                    'flex items-center gap-2 rounded-lg p-1.5 text-start hover:bg-fd-accent hover:text-fd-accent-foreground',
                  )}
                  onClick={() => choose(l.code)}
                >
                  <span className="min-w-0 flex-1 text-sm font-medium leading-none">
                    {l.name}
                  </span>
                  <Check
                    className={cn(
                      'ms-auto size-3.5 shrink-0 text-fd-primary',
                      !isActive && 'invisible',
                    )}
                  />
                </button>
              );
            })}
          </PopoverContent>
        </Popover>

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
