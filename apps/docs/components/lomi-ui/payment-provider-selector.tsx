'use client';

/* eslint-disable @next/next/no-img-element -- lomi. UI registry components are framework-portable copy-paste components. */

import * as React from 'react';
import { CheckoutCard } from './lib/checkout-card';
import {
  CheckoutInput,
  checkoutCustomerFieldClass,
} from './lib/checkout-input';
import './lib/checkout-ui.css';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export type ProviderId = 'WAVE' | 'MTN' | 'cards' | 'spi';

type MethodInfo = {
  image: string;
  label: string;
  imageClass: string;
  containerClass: string;
  width: number;
  height: number;
};

const MOBILE_MONEY_IDS = new Set<ProviderId>(['WAVE', 'MTN']);

const DEFAULT_PROVIDERS: ProviderId[] = ['WAVE', 'MTN', 'cards', 'spi'];

const DEFAULT_LABELS = {
  WAVE: 'Wave',
  MTN: 'MTN',
  cards: 'Card',
  spi: 'π—SPI',
};

function getMethodInfo(method: ProviderId, cardLabel: string): MethodInfo {
  if (method === 'cards') {
    return {
      image: '/placeholder/card.webp',
      label: cardLabel,
      imageClass: 'object-contain -ml-1.5 translate-y-[3px]',
      containerClass: 'justify-center mb-0.5',
      width: 40,
      height: 40,
    };
  }

  if (MOBILE_MONEY_IDS.has(method)) {
    return {
      image:
        method === 'WAVE'
          ? '/payment_channels/wave.webp'
          : `/payment_channels/${method.toLowerCase()}.webp`,
      label: DEFAULT_LABELS[method],
      imageClass: 'object-contain rounded-[4px] translate-y-1.5',
      containerClass: 'justify-start w-full mb-2 -ml-0',
      width: 28,
      height: 28,
    };
  }

  if (method === 'spi') {
    return {
      image: '/payment_channels/pi_spi.webp',
      label: DEFAULT_LABELS.spi,
      imageClass: 'object-contain translate-y-[6px]',
      containerClass: 'justify-start w-full mb-[9px] -ml-0',
      width: 80,
      height: 32,
    };
  }

  return {
    image: '',
    label: method,
    imageClass: '',
    containerClass: '',
    width: 40,
    height: 40,
  };
}

export interface PaymentProviderSelectorProps {
  providers?: ProviderId[];
  selectedProvider?: ProviderId | null;
  onProviderChange?: (provider: ProviderId) => void;
  disabledProviders?: ProviderId[];
  /** When false, SPI cannot be selected (matches hosted checkout SPI gate). */
  spiOperational?: boolean;
  /** Label for the card payment method (production uses i18n). */
  cardLabel?: string;
  className?: string;
}

export function PaymentProviderSelector({
  providers = DEFAULT_PROVIDERS,
  selectedProvider: controlledSelectedProvider,
  onProviderChange,
  disabledProviders = [],
  spiOperational = true,
  cardLabel = DEFAULT_LABELS.cards,
  className,
}: PaymentProviderSelectorProps) {
  const [internalSelectedProvider, setInternalSelectedProvider] =
    React.useState<ProviderId | null>(null);
  const [spiAlias, setSpiAlias] = React.useState('');

  const selectedProvider =
    controlledSelectedProvider !== undefined &&
    controlledSelectedProvider !== null
      ? controlledSelectedProvider
      : internalSelectedProvider;

  const availableProviders = React.useMemo(
    () => providers.filter((provider) => provider !== 'spi' || spiOperational),
    [providers, spiOperational],
  );

  React.useEffect(() => {
    const isParentControlling =
      controlledSelectedProvider !== undefined &&
      controlledSelectedProvider !== null;

    if (
      !isParentControlling &&
      internalSelectedProvider === null &&
      availableProviders.length > 0
    ) {
      const defaultProvider = availableProviders[0];
      if (defaultProvider) {
        setTimeout(() => {
          setInternalSelectedProvider(defaultProvider);
        }, 0);
        onProviderChange?.(defaultProvider);
      }
    }
  }, [
    availableProviders,
    controlledSelectedProvider,
    internalSelectedProvider,
    onProviderChange,
  ]);

  const handleProviderSelect = (provider: ProviderId) => {
    if (!availableProviders.includes(provider)) return;
    if (disabledProviders.includes(provider)) return;
    if (provider === 'spi' && !spiOperational) return;

    setInternalSelectedProvider(provider);
    onProviderChange?.(provider);

    if (provider !== 'spi') setSpiAlias('');
  };

  return (
    <div className={cn('lomi-checkout-ui space-y-0', className)}>
      <div className="relative w-full">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory pb-2 px-1 touch-pan-x">
          {availableProviders.map((provider) => {
            const isSelected = selectedProvider === provider;
            const isSpiDisabled = provider === 'spi' && !spiOperational;
            const isProviderDisabled = disabledProviders.includes(provider);
            const methodInfo = getMethodInfo(provider, cardLabel);

            return (
              <CheckoutCard
                key={provider}
                onClick={() =>
                  !isSpiDisabled &&
                  !isProviderDisabled &&
                  handleProviderSelect(provider)
                }
                className={cn(
                  'relative flex-shrink-0 flex flex-col items-start justify-center transition-all duration-200 min-w-0 bg-white snap-center p-4 -ml-1',
                  isSpiDisabled || isProviderDisabled
                    ? 'cursor-not-allowed opacity-60 grayscale'
                    : 'cursor-pointer',
                  isSelected
                    ? 'border-[#56A5F9] bg-slate-100/50 shadow-md'
                    : 'border-border/40 hover:border-border/60 hover:bg-gray-50/50 hover:shadow-sm',
                  'w-[103.25px] md:w-[142px]',
                )}
                style={{ height: '70px' }}
              >
                <div
                  className={cn('flex items-center', methodInfo.containerClass)}
                >
                  <img
                    src={methodInfo.image}
                    alt={methodInfo.label}
                    width={methodInfo.width}
                    height={methodInfo.height}
                    className={methodInfo.imageClass}
                    style={{
                      width: methodInfo.width,
                      height: methodInfo.height,
                      objectFit: 'contain',
                    }}
                  />
                </div>
                <span
                  className="text-xs font-medium text-left w-full"
                  style={{ color: '#000' }}
                >
                  {methodInfo.label}
                </span>
                {isSelected ? (
                  <div className="absolute top-1 right-1 bg-[#56A5F9] rounded-full p-0.5 shadow-sm">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                ) : null}
              </CheckoutCard>
            );
          })}
        </div>
      </div>

      {selectedProvider === 'spi' ? (
        <div className="space-y-3">
          <CheckoutInput
            type="text"
            value={spiAlias}
            onChange={(event) => setSpiAlias(event.target.value)}
            placeholder="your-alias@bank"
            className={cn(
              checkoutCustomerFieldClass,
              'mb-0.5 rounded-sm shadow-none',
            )}
          />
        </div>
      ) : null}
    </div>
  );
}
