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
  height = 18,
  className = '',
  priority = false,
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
        style={{ height: 'auto' }}
      />
      <Image
        src="/company/lomi_l.webp"
        alt="lomi."
        width={width}
        height={height}
        className={`hidden dark:block ${className}`.trim()}
        priority={priority}
        style={{ height: 'auto' }}
      />
    </>
  );
}

// Legacy export for backward compatibility
export const logo = <Logo />;
