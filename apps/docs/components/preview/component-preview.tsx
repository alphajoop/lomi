'use client';

import * as React from 'react';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface ComponentPreviewProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export function ComponentPreview({
  children,
  className,
  ...props
}: ComponentPreviewProps) {
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  return (
    <div
      className={cn(
        'not-prose relative flex flex-col overflow-hidden rounded-sm border border-border bg-background transition-colors',
        isDarkMode && 'dark',
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-end border-b border-border bg-muted/20 p-2">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          title="Toggle dark mode"
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>
      </div>
      <div className="flex min-h-[350px] w-full items-center justify-center p-6 md:p-10">
        <div className="mx-auto flex w-full flex-col items-center *:mx-auto *:max-w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
