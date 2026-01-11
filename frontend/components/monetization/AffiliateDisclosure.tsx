'use client';

import { AFFILIATE_DISCLOSURE_TEXT } from '@/lib/monetization/constants';

interface AffiliateDisclosureProps {
  className?: string;
}

/**
 * Affiliate Disclosure Component
 *
 * FTC-compliant disclosure for affiliate booking links.
 * Must appear near booking CTAs.
 *
 * ETHICAL REQUIREMENT: This text must remain visible and unmodified.
 */
export default function AffiliateDisclosure({
  className = '',
}: AffiliateDisclosureProps) {
  return (
    <p
      className={`text-xs text-gray-500 ${className}`}
      aria-label="Affiliate disclosure"
    >
      {AFFILIATE_DISCLOSURE_TEXT}
    </p>
  );
}
