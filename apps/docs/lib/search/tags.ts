/* @proprietary license */

export type DocsSearchTag = 'core' | 'reference' | 'resources';

/** Map the top-level docs section to the search-dialog filter chips. */
export function searchTagFromSection(
  section: string | undefined,
): DocsSearchTag | undefined {
  switch (section) {
    case 'start':
    case 'build':
      return 'core';
    case 'api':
      return 'reference';
    case 'resources':
      return 'resources';
    default:
      return undefined;
  }
}
