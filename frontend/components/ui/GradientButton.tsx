/**
 * GradientButton - Reusable Purple-Pink Gradient Button (Phase 10)
 *
 * Primary CTA button with purple-to-pink gradient background.
 */

import React, { ButtonHTMLAttributes } from 'react';

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export default function GradientButton({
  children,
  className = '',
  ...props
}: GradientButtonProps) {
  return (
    <button
      className={`py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
