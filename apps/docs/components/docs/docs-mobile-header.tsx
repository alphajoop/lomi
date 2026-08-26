'use client';

import Link from 'next/link';
import { useSidebar } from 'fumadocs-ui/layouts/docs/slots/sidebar';
import { Logo } from '@/lib/utils/logo';
import { useTranslation } from '@/lib/utils/translation-context';
import { t as translate } from '@/lib/i18n/translations';

function MenuIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden
      >
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    );
  }

  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function DocsMobileHeader() {
  const { open, setOpen } = useSidebar();
  const { currentLanguage } = useTranslation();
  const t = (key: string) => translate(key, currentLanguage);
  const menuLabel = open ? t('docs.shell.closeNav') : t('docs.shell.openNav');

  return (
    <header
      id="nd-subnav"
      className={
        open
          ? 'relative z-50 flex h-16 shrink-0 items-center justify-between gap-4 bg-background pl-5 pr-2 pt-2 md:hidden [grid-area:header] sticky top-(--fd-docs-row-1) max-md:layout:[--fd-header-height:4rem]'
          : 'z-30 flex h-16 shrink-0 items-center justify-between gap-4 bg-background pl-5 pr-2 pt-2 md:hidden [grid-area:header] sticky top-(--fd-docs-row-1) max-md:layout:[--fd-header-height:4rem]'
      }
    >
      <Link href="/start/overview" className="inline-flex items-center">
        <Logo width={68} height={34} priority />
      </Link>
      <button
        type="button"
        className="flex size-11 items-center justify-center text-fd-muted-foreground outline-none transition [-webkit-tap-highlight-color:transparent] hover:text-fd-foreground focus:outline-none focus-visible:outline-none"
        onClick={() => setOpen(!open)}
        aria-label={menuLabel}
        aria-expanded={open}
      >
        <MenuIcon open={open} />
      </button>
    </header>
  );
}
