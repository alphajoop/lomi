'use client';

import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogFooter,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogOverlay,
  type SharedProps,
} from 'fumadocs-ui/components/dialog/search';
import { useState, useEffect } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'fumadocs-ui/components/ui/popover';
import { ChevronDown } from 'lucide-react';
import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import { cn } from '@lomi./ui/cn';
import { useTranslation } from '@/lib/utils/translation-context';
import { t as translate } from '@/lib/i18n/translations';
import { orama } from '@/lib/orama/client';
import type { OramaCloudSearchParams } from '@orama/core';
import type { SortedResult } from 'fumadocs-core/search';

// Define types for Orama search results
interface OramaHit {
  id: string;
  document: {
    id?: string;
    url?: string;
    title?: string;
    breadcrumbs?: string[];
    description?: string;
    structured?: {
      contents?: string[];
    };
  };
}

export default function CustomSearchDialog(props: SharedProps) {
  const [open, setOpen] = useState(false);
  const [tag, setTag] = useState<string | undefined>();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<SortedResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { currentLanguage } = useTranslation();
  const t = (key: string) => String(translate(key, currentLanguage));

  const items = [
    {
      name: t('search.all'),
      value: undefined,
    },
    {
      name: t('search.core'),
      description: t('search.fundamentalsDescription'),
      value: 'core',
    },
    {
      name: t('search.apiReference'),
      description: t('search.apiReferenceDescription'),
      value: 'reference',
    },
  ];

  // Custom search implementation using Orama client directly
  useEffect(() => {
    let cancelled = false;

    async function performSearch() {
      if (!search || search.trim().length === 0) {
        setResults(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const apiKey = process.env.NEXT_PUBLIC_ORAMA_API_KEY;
        const projectId = process.env.NEXT_PUBLIC_ORAMA_PROJECT_ID;
        const datasourceId = process.env.NEXT_PUBLIC_ORAMA_DATASOURCE_ID;

        if (!apiKey || !projectId) {
          console.error(
            'Orama search is not configured. Missing environment variables:',
            {
              hasApiKey: !!apiKey,
              hasProjectId: !!projectId,
            },
          );
          setResults([]);
          setIsLoading(false);
          return;
        }

        const searchOptions: OramaCloudSearchParams = {
          term: search,
          limit: 10,
        };

        if (datasourceId) {
          searchOptions.datasources = [datasourceId];
        }

        // Add tag filter if specified
        if (tag) {
          searchOptions.where = {
            tag: { eq: tag },
          };
        }

        const response = await orama.search(searchOptions);

        if (cancelled) return;

        // Debug: log the raw response structure (only in development)
        if (process.env.NODE_ENV === 'development') {
          console.log('Orama search response:', {
            count: response?.count,
            hitsCount: response?.hits?.length,
            firstHit: response?.hits?.[0],
          });
        }

        // Transform Orama Cloud results to fumadocs format
        if (response && response.hits && Array.isArray(response.hits)) {
          const transformedResults: SortedResult[] = [];
          const searchLower = search.toLowerCase();

          response.hits.forEach((hit: OramaHit) => {
            const doc = hit.document || {};
            const pageUrl = doc.url || doc.id || hit.id;
            const pageTitle = doc.title || 'Untitled';

            // Add breadcrumb context to the page title
            const breadcrumbText =
              doc.breadcrumbs &&
              Array.isArray(doc.breadcrumbs) &&
              doc.breadcrumbs.length > 0
                ? doc.breadcrumbs.join(' › ') + ' › '
                : '';

            // Main page result with breadcrumb prefix
            transformedResults.push({
              type: 'page' as const,
              id: doc.id || hit.id,
              url: pageUrl,
              content: breadcrumbText + pageTitle,
            });

            // Add description as a text result if it exists and contains the search term
            if (
              doc.description &&
              doc.description.toLowerCase().includes(searchLower)
            ) {
              transformedResults.push({
                type: 'text' as const,
                id: `${doc.id}-desc`,
                url: pageUrl,
                content: doc.description,
              });
            }

            // Add matching content sections as text results
            if (
              doc.structured?.contents &&
              Array.isArray(doc.structured.contents)
            ) {
              // Find all content sections that contain the search term
              const matchingContents = doc.structured.contents
                .filter(
                  (content: string) =>
                    content.toLowerCase().includes(searchLower) &&
                    content.length > 20,
                )
                .slice(0, 2); // Limit to 2 matching sections per page

              matchingContents.forEach((content: string, idx: number) => {
                const maxLength = 120;
                const index = content.toLowerCase().indexOf(searchLower);

                let excerpt = content;
                if (content.length > maxLength) {
                  // Center the excerpt around the match
                  const start = Math.max(0, index - 40);
                  const end = Math.min(content.length, start + maxLength);
                  excerpt =
                    (start > 0 ? '...' : '') +
                    content.substring(start, end) +
                    (end < content.length ? '...' : '');
                }

                transformedResults.push({
                  type: 'text' as const,
                  id: `${doc.id}-content-${idx}`,
                  url: pageUrl,
                  content: excerpt,
                });
              });
            }
          });

          setResults(transformedResults);
        } else {
          setResults([]);
        }
      } catch (error) {
        // Log error details for debugging
        console.error('Search error:', error);

        // Check if it's a configuration error
        if (
          error instanceof Error &&
          error.message.includes('not configured')
        ) {
          console.error(
            'Orama search configuration error. Please check your environment variables.',
          );
        }

        if (!cancelled) {
          setResults([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    const timeoutId = setTimeout(performSearch, 300); // Debounce search

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [search, tag]);

  return (
    <SearchDialog
      search={search}
      onSearchChange={setSearch}
      isLoading={isLoading}
      {...props}
    >
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput />
          <SearchDialogClose />
        </SearchDialogHeader>
        <SearchDialogList items={results} />
        <SearchDialogFooter className="flex flex-row flex-wrap gap-2 items-center">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
              className={buttonVariants({
                size: 'sm',
                color: 'ghost',
                className: '-m-1.5 me-auto',
              })}
            >
              <span className="text-fd-muted-foreground/80 me-2">
                {t('search.filter')}
              </span>
              {items.find((item) => item.value === tag)?.name}
              <ChevronDown className="size-3.5 text-fd-muted-foreground" />
            </PopoverTrigger>
            <PopoverContent className="flex flex-col p-1 gap-1" align="start">
              {items.map((item, i) => {
                const isSelected = item.value === tag;

                return (
                  <button
                    key={i}
                    onClick={() => {
                      setTag(item.value);
                      setOpen(false);
                    }}
                    className={cn(
                      'rounded-sm text-start px-2 py-1.5',
                      isSelected
                        ? 'text-fd-primary bg-fd-primary/10'
                        : 'hover:text-fd-accent-foreground hover:bg-fd-accent',
                    )}
                  >
                    <p className="font-medium mb-0.5">{item.name}</p>
                    <p className="text-xs opacity-70">{item.description}</p>
                  </button>
                );
              })}
            </PopoverContent>
          </Popover>
        </SearchDialogFooter>
      </SearchDialogContent>
    </SearchDialog>
  );
}
