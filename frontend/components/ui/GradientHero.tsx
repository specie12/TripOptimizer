/**
 * GradientHero - Hero Section Background Component (Phase 10)
 *
 * Purple-to-pink gradient background wrapper for hero sections.
 */

import React, { HTMLAttributes } from 'react';

interface GradientHeroProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export default function GradientHero({
  children,
  className = '',
  ...props
}: GradientHeroProps) {
  return (
    <div
      className={`bg-gradient-to-br from-purple-50 via-pink-50 to-white ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
