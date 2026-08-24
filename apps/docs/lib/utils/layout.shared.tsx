/* @proprietary license */

import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { DocsSidebarLocaleAndTheme } from '@/components/docs/sidebar-locale-theme';
import { Logo } from './logo';

/**
 * Shared layout configurations
 *
 * you can customise layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/(docs)/layout.tsx
 */
export const logo = <Logo priority />;

export const linkItems: BaseLayoutProps['links'] = [];

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: logo,
    },
    // see fumadocs-ui navigation links
    links: linkItems,
    themeSwitch: {
      // Sidebar bottom bar: language + default light/dark toggle (Fumadocs same row as icon links)
      component: <DocsSidebarLocaleAndTheme />,
    },
  };
}
