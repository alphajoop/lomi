/* @proprietary license */

import Image from 'next/image';

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export function Logo({
  width = 60,
  height = 30,
  className = '',
  priority = true,
}: LogoProps) {
  return (
    <>
      <Image
        src="/company/lomi_d.webp"
        alt="lomi."
        width={width}
        height={height}
        className={`block dark:hidden ${className}`.trim()}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
        style={{ width, height: 'auto' }}
      />
      <Image
        src="/company/lomi_l.webp"
        alt="lomi."
        width={width}
        height={height}
        className={`hidden dark:block ${className}`.trim()}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
        style={{ width, height: 'auto' }}
      />
    </>
  );
}

// Legacy export for backward compatibility
export const logo = <Logo />;
