/* @proprietary license */

import { ImageResponse } from 'next/og';
import type { ReactNode } from 'react';
import fs from 'node:fs/promises';
import type { ImageResponseOptions } from 'next/server';

export interface GenerateProps {
  title: ReactNode;
  description?: ReactNode;
}

const font = await fs.readFile('./lib/og/Inter-Regular.ttf');
const fontBold = await fs.readFile('./lib/og/Inter-SemiBold.ttf');

export async function generateOGImage(
  options: GenerateProps & Partial<ImageResponseOptions>,
): Promise<ImageResponse> {
  const { title, description, ...rest } = options;

  return new ImageResponse(
    generate({
      title,
      description,
    }),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Inter',
          data: font,
          weight: 400,
        },
        {
          name: 'Inter',
          data: fontBold,
          weight: 600,
        },
      ],
      ...rest,
    },
  );
}

function generate({ title, description }: GenerateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        color: 'white',
        backgroundColor: 'rgb(10,10,10)',
        fontFamily: 'Inter',
        padding: '4.5rem 5rem',
      }}
    >
      <p
        style={{
          fontFamily: 'Inter',
          fontWeight: 600,
          fontSize: '64px',
          lineHeight: 1.15,
          margin: 0,
          letterSpacing: '-0.02em',
        }}
      >
        {title}
      </p>
      {description ? (
        <p
          style={{
            fontFamily: 'Inter',
            fontWeight: 400,
            fontSize: '28px',
            lineHeight: 1.4,
            color: 'rgba(240,240,240,0.65)',
            margin: '1.25rem 0 0 0',
            maxWidth: '920px',
          }}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
