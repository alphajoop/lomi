/* @proprietary license */

'use client';

import { FuzzyText } from '@lomi./ui/fuzzy-text';

type NotFoundPageProps = {
  label: string;
};

export function NotFoundPage({ label }: NotFoundPageProps) {
  return (
    <div className="flex h-svh items-center justify-center overflow-hidden bg-background px-4">
      <FuzzyText
        fontSize="clamp(1.25rem, 6vw, 2.5rem)"
        fontWeight={900}
        fontFamily="Fira Mono, monospace"
        baseIntensity={0.2}
        hoverIntensity={0.4}
        enableHover
      >
        {label}
      </FuzzyText>
    </div>
  );
}
