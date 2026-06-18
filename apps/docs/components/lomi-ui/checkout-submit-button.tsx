'use client';

import * as React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
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

function CheckoutSpinner({
  color,
  className,
}: {
  color: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-block h-5 w-5 animate-spin rounded-full border-2 border-t-transparent',
        className,
      )}
      style={{ borderColor: color, borderTopColor: 'transparent' }}
      aria-hidden="true"
    />
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
          'relative w-full rounded-sm pr-8 text-lg font-semibold transition-colors duration-200 outline-none',
          paymentStatus === 'success' && '!bg-green-700 hover:!bg-green-800',
          paymentStatus === 'error' && '!bg-red-800 hover:!bg-red-900',
          paymentStatus === 'processing' && 'disabled:opacity-100',
        )}
        style={{
          height: '3.05rem',
          ...(paymentStatus === 'success' || paymentStatus === 'error'
            ? { color: '#ffffff' }
            : {
                backgroundColor: payButtonBgColor,
                color: payButtonForeground,
              }),
        }}
      >
        {paymentStatus === 'processing' ? (
          <span className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center">
            <CheckoutSpinner color={payButtonForeground} />
          </span>
        ) : paymentStatus === 'success' ? (
          <CheckCircle className="mx-auto h-5 w-5 text-green-200" />
        ) : paymentStatus === 'error' ? (
          <XCircle className="mx-auto h-5 w-5 text-red-300" />
        ) : (
          buttonLabel
        )}
      </button>
    </div>
  );
}
