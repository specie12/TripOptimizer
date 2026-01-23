'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/formatters';

// =============================================================================
// TYPES
// =============================================================================

interface OptimizationOpportunity {
  id: string;
  opportunityType: string;
  title: string;
  description: string;
  potentialSavings: number;
  affectedEntities: AffectedEntity[];
  alternatives: AlternativeRecommendation[];
  expiresAt?: string;
  createdAt: string;
}

interface AffectedEntity {
  entityType: 'flight' | 'hotel' | 'activity';
  entityId: string;
  currentLockStatus: string;
  canOptimize: boolean;
  reason?: string;
}

interface AlternativeRecommendation {
  id: string;
  entityType: 'flight' | 'hotel' | 'activity';
  name: string;
  provider: string;
  price: number;
  priceDifference: number;
  improvementReason: string;
  deepLink: string;
}

interface OptimizationNotifierProps {
  tripRequestId: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get icon for entity type
 */
function getEntityIcon(entityType: string): string {
  const icons: Record<string, string> = {
    flight: '✈️',
    hotel: '🏨',
    activity: '🎯',
  };
  return icons[entityType] || '📍';
}

/**
 * Format time remaining
 */
function getTimeRemaining(expiresAt?: string): string {
  if (!expiresAt) return '';

  const now = new Date().getTime();
  const expiry = new Date(expiresAt).getTime();
  const diff = expiry - now;

  if (diff < 0) return 'Expired';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }
  return `${minutes}m remaining`;
}

// =============================================================================
// OPTIMIZATION NOTIFIER COMPONENT
// =============================================================================

export default function OptimizationNotifier({ tripRequestId }: OptimizationNotifierProps) {
  const [opportunities, setOpportunities] = useState<OptimizationOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Fetch optimization opportunities
  useEffect(() => {
    async function fetchOpportunities() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('http://localhost:3000/optimization/reoptimize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tripRequestId,
            trigger: 'MANUAL',
            respectLocks: true,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch optimization opportunities');
        }

        const data = await response.json();
        setOpportunities(data.opportunities || []);
      } catch (err) {
        console.error('Error fetching optimization opportunities:', err);
        setError(err instanceof Error ? err.message : 'Failed to load optimization opportunities');
      } finally {
        setLoading(false);
      }
    }

    fetchOpportunities();

    // Poll for new opportunities every 5 minutes
    const interval = setInterval(fetchOpportunities, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [tripRequestId]);

  // Filter out dismissed opportunities
  const visibleOpportunities = opportunities.filter((opp) => !dismissed.has(opp.id));

  if (loading) {
    return null; // Don't show loading state for notifications
  }

  if (error || visibleOpportunities.length === 0) {
    return null; // Don't show anything if no opportunities
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3 max-w-md">
      {visibleOpportunities.map((opportunity) => (
        <div
          key={opportunity.id}
          className="bg-white rounded-lg shadow-lg border-l-4 border-green-500 p-4 animate-slide-in"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Header */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">💰</span>
                <h3 className="font-bold text-gray-900">{opportunity.title}</h3>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-3">{opportunity.description}</p>

              {/* Savings */}
              <div className="bg-green-50 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-900">Potential Savings</span>
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(opportunity.potentialSavings)}
                  </span>
                </div>
              </div>

              {/* Alternatives */}
              {opportunity.alternatives.length > 0 && (
                <div className="space-y-2 mb-3">
                  <p className="text-xs font-medium text-gray-700 uppercase">Available Options:</p>
                  {opportunity.alternatives.slice(0, 2).map((alt) => (
                    <div
                      key={alt.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <span>{getEntityIcon(alt.entityType)}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{alt.name}</p>
                          <p className="text-xs text-gray-500">{alt.improvementReason}</p>
                        </div>
                      </div>
                      <a
                        href={alt.deepLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {/* Expiry time */}
              {opportunity.expiresAt && (
                <div className="flex items-center gap-1 text-xs text-orange-600">
                  <span>⏱️</span>
                  <span>{getTimeRemaining(opportunity.expiresAt)}</span>
                </div>
              )}
            </div>

            {/* Dismiss button */}
            <button
              onClick={() => setDismissed((prev) => new Set(prev).add(opportunity.id))}
              className="text-gray-400 hover:text-gray-600 ml-2"
              aria-label="Dismiss"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
