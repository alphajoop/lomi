'use client';

import * as React from 'react';
import { getPayButtonForeground } from './lib/pay-button-contrast';

export type CheckoutPaymentStatus = 'idle' | 'processing' | 'success' | 'error';

export interface CheckoutSubmitButtonProps {
  label?: string;
  subscribeLabel?: string;
  isSubscription?: boolean;
  payButtonBgColor?: string;
  paymentStatus?: CheckoutPaymentStatus;
  disabled?: boolean;
  type?: 'button' | 'submit';
  onClick?: () => void;
  className?: string;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function CheckoutSpinner({ color }: { color: string }) {
  return (
    <span
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
      style={{ borderColor: color, borderTopColor: 'transparent' }}
      aria-hidden="true"
    />
  );
}

function PayFaces({
  status,
  idleLabel,
  color,
}: {
  status: CheckoutPaymentStatus;
  idleLabel: string;
  color: string;
}) {
  const faces: Array<{ key: CheckoutPaymentStatus; node: React.ReactNode }> = [
    { key: 'idle', node: idleLabel },
    {
      key: 'processing',
      node: (
        <>
          <CheckoutSpinner color={color} />
          {idleLabel}
        </>
      ),
    },
    {
      key: 'success',
      node: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M2.6 6.3 4.9 8.6 9.4 3.6"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      key: 'error',
      node: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 3 9 9M9 3 3 9"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
  ];

  return (
    <span aria-hidden className="relative grid w-full place-items-center">
      {faces.map((face) => (
        <span
          key={face.key}
          className={cn(
            'col-start-1 row-start-1 flex items-center justify-center gap-1.5 whitespace-nowrap transition-opacity duration-150',
            face.key === status ? 'opacity-100' : 'opacity-0',
          )}
        >
          {face.node}
        </span>
      ))}
    </span>
  );
}

export function CheckoutSubmitButton({
  label = 'Pay',
  subscribeLabel = 'Subscribe',
  isSubscription = false,
  payButtonBgColor = '#121317',
  paymentStatus = 'idle',
  disabled = false,
  type = 'button',
  onClick,
  className,
}: CheckoutSubmitButtonProps) {
  const payButtonForeground = getPayButtonForeground(payButtonBgColor);
  const buttonLabel = isSubscription ? subscribeLabel : label;

  return (
    <div className={cn('flex flex-col items-center pt-1', className)}>
      <button
        type={type}
        onClick={onClick}
        disabled={disabled || paymentStatus === 'processing'}
        className={cn(
          'relative inline-flex h-12 w-full select-none items-center justify-center rounded-[9px] px-3 text-[13px] font-semibold outline-none transition-[border-color,box-shadow,background-color] duration-150',
          'shadow-none',
          paymentStatus === 'success' && '!bg-green-700 hover:!bg-green-800',
          paymentStatus === 'error' && '!bg-red-800 hover:!bg-red-900',
          paymentStatus === 'processing' && 'disabled:opacity-100',
        )}
        style={{
          touchAction: 'manipulation',
          ...(paymentStatus === 'success' || paymentStatus === 'error'
            ? { color: '#ffffff' }
            : {
                backgroundColor: payButtonBgColor,
                color: payButtonForeground,
              }),
        }}
      >
        <PayFaces
          status={paymentStatus}
          idleLabel={buttonLabel}
          color={payButtonForeground}
        />
        <span role="status" aria-live="polite" className="sr-only">
          {paymentStatus === 'success'
            ? 'Done'
            : paymentStatus === 'error'
              ? 'Failed'
              : ''}
        </span>
      </button>
    </div>
  );
}
