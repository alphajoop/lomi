/* @proprietary license */

'use client';

import {
  createContext,
  use,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { Check, ChevronsUpDown } from 'lucide-react';
import {
  Sidebar as FumadocsSidebar,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
  type SidebarProps,
} from 'fumadocs-ui/layouts/docs/slots/sidebar';
import {
  DocsLayout,
  useDocsLayout,
  type DocsLayoutProps,
} from 'fumadocs-ui/layouts/docs';
import { isLayoutTabActive, type LayoutTab } from 'fumadocs-ui/layouts/shared';
import { TreeContextProvider, useTreeContext } from 'fumadocs-ui/contexts/tree';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'fumadocs-ui/components/ui/popover';
import type { Root } from 'fumadocs-core/page-tree';
import { useTranslation } from '@/lib/utils/translation-context';
import { t as translate } from '@/lib/i18n/translations';
import { cn } from '@lomi./ui/cn';
import { DocsMobileHeader } from '@/components/docs/docs-mobile-header';

type PreviewContextValue = {
  previewUrl: string | null;
  setPreviewUrl: (url: string | null) => void;
  tabs: LayoutTab[];
};

const MobileSectionPreviewContext = createContext<PreviewContextValue | null>(
  null,
);

function useMobileSectionPreview() {
  return use(MobileSectionPreviewContext);
}

function lastMatchingTab(
  tabs: LayoutTab[],
  pathname: string,
): LayoutTab | undefined {
  for (let i = tabs.length - 1; i >= 0; i -= 1) {
    if (isLayoutTabActive(tabs[i], pathname)) return tabs[i];
  }
  return undefined;
}

function folderTree(folder: LayoutTab['$folder'], previewUrl: string): Root {
  return {
    name: typeof folder?.name === 'string' ? folder.name : 'docs',
    children: folder?.children ?? [],
    $id: `mobile-section:${previewUrl}`,
  };
}

function MobileSectionPreviewRoot({ children }: { children: ReactNode }) {
  const { full } = useTreeContext();
  const {
    props: { tabs },
  } = useDocsLayout();
  const { open, mode } = useSidebar();
  const pathname = usePathname();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    setPreviewUrl(null);
  }, [pathname]);

  useEffect(() => {
    if (!open || mode !== 'drawer') setPreviewUrl(null);
  }, [mode, open]);

  useEffect(() => {
    const root = document.querySelector(
      '#nd-sidebar-mobile > .overflow-hidden.min-h-0.flex-1',
    );
    if (root) root.scrollTop = 0;
  }, [previewUrl]);

  const previewTab = useMemo(
    () => tabs.find((tab) => tab.url === previewUrl && tab.$folder),
    [previewUrl, tabs],
  );

  const tree = useMemo(() => {
    if (mode !== 'drawer' || !previewTab?.$folder || !previewUrl) return full;
    return folderTree(previewTab.$folder, previewUrl);
  }, [full, mode, previewTab, previewUrl]);

  const value = useMemo(
    () => ({ previewUrl, setPreviewUrl, tabs }),
    [previewUrl, tabs],
  );

  return (
    <MobileSectionPreviewContext.Provider value={value}>
      <TreeContextProvider tree={tree}>{children}</TreeContextProvider>
    </MobileSectionPreviewContext.Provider>
  );
}

export function DocsSidebar(props: SidebarProps) {
  return (
    <MobileSectionPreviewRoot>
      <FumadocsSidebar {...props} />
    </MobileSectionPreviewRoot>
  );
}

export function DocsAppLayout({ slots, ...props }: DocsLayoutProps) {
  return (
    <DocsLayout
      {...props}
      slots={{
        ...slots,
        header: DocsMobileHeader,
        sidebar: {
          provider: SidebarProvider,
          root: DocsSidebar,
          trigger: SidebarTrigger,
          useSidebar,
        },
      }}
    />
  );
}

export function DocsMobileSectionSwitch() {
  const preview = useMobileSectionPreview();
  const pathname = usePathname();
  const { currentLanguage } = useTranslation();
  const [open, setOpen] = useState(false);
  const t = (key: string) => translate(key, currentLanguage);

  if (!preview || preview.tabs.length === 0) return null;

  const selected =
    preview.tabs.find((tab) => tab.url === preview.previewUrl) ??
    lastMatchingTab(preview.tabs, pathname) ??
    preview.tabs[0];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        className="docs-mobile-section-switch flex items-center gap-2 rounded-lg md:hidden"
        title={t('docs.shell.sectionNav')}
      >
        {selected?.icon ? (
          <div className="docs-mobile-section-icon size-4 shrink-0">
            {selected.icon}
          </div>
        ) : null}
        <span className="min-w-0 flex-1 truncate text-start text-sm font-medium">
          {selected?.title}
        </span>
        <ChevronsUpDown className="ms-auto size-4 shrink-0 text-fd-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="flex w-(--radix-popover-trigger-width) flex-col gap-1 p-1 fd-scroll-container">
        {preview.tabs.map((tab) => {
          const isActive = selected?.url === tab.url;
          return (
            <button
              key={tab.url}
              type="button"
              className={cn(
                'flex items-center gap-2 rounded-lg p-1.5 text-start hover:bg-fd-accent hover:text-fd-accent-foreground',
              )}
              onClick={() => {
                preview.setPreviewUrl(tab.url);
                setOpen(false);
              }}
            >
              {tab.icon ? (
                <div className="docs-mobile-section-icon size-4 shrink-0">
                  {tab.icon}
                </div>
              ) : null}
              <span className="min-w-0 flex-1 text-sm font-medium leading-none">
                {tab.title}
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
  );
}
