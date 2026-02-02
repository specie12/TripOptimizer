'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/formatters';

interface TransportLink {
  label: string;
  url: string;
}

interface TransportInfo {
  cityName: string;
  days: number;
  costRangeLow: number;
  costRangeHigh: number;
  isEstimate: boolean;
  transitPassName: string;
  links: {
    publicTransit: TransportLink;
    rideHailing: TransportLink;
    taxi: TransportLink;
    airportTransfer: TransportLink;
  };
  tips: string[];
  dailyCostRange: { low: number; high: number };
  airportTransferRange: { low: number; high: number };
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function TransportPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const destination = decodeURIComponent(params.destination as string);
  const budget = parseInt(searchParams.get('budget') || '0', 10);
  const days = parseInt(searchParams.get('days') || '5', 10);

  const handleBack = () => router.back();

  const [info, setInfo] = useState<TransportInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(
          `${API_BASE}/trip/transport/${encodeURIComponent(destination)}?days=${days}`
        );
        if (!res.ok) throw new Error('Failed to load transport info');
        const data = await res.json();
        setInfo(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [destination, days]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading transport info...</p>
        </div>
      </div>
    );
  }

  if (error || !info) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'No data available'}</p>
          <button onClick={handleBack} className="text-purple-600 underline">
            Back to trip results
          </button>
        </div>
      </div>
    );
  }

  const linkSections = [
    {
      title: 'Public Transit',
      icon: '🚇',
      description: `Pass: ${info.transitPassName}`,
      link: info.links.publicTransit,
      color: 'bg-blue-50 border-blue-200',
    },
    {
      title: 'Ride-Hailing',
      icon: '📱',
      description: 'Book rides from your phone',
      link: info.links.rideHailing,
      color: 'bg-green-50 border-green-200',
    },
    {
      title: 'Taxis',
      icon: '🚕',
      description: 'Traditional taxi services',
      link: info.links.taxi,
      color: 'bg-yellow-50 border-yellow-200',
    },
    {
      title: 'Airport Transfers',
      icon: '✈️',
      description: `Range: ${formatCurrency(info.airportTransferRange.low)}–${formatCurrency(info.airportTransferRange.high)} each way`,
      link: info.links.airportTransfer,
      color: 'bg-purple-50 border-purple-200',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-3xl mx-auto px-6 py-10">
          <button
            onClick={handleBack}
            className="inline-flex items-center text-white/80 hover:text-white mb-6 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to trip results
          </button>

          <h1 className="text-3xl font-bold mb-2">
            Getting Around {info.cityName}
          </h1>

          <div className="flex flex-wrap items-center gap-4 mt-4">
            <div className="bg-white/20 rounded-lg px-4 py-2">
              <p className="text-sm text-white/80">Estimated {info.days}-day total</p>
              <p className="text-2xl font-bold">
                {formatCurrency(info.costRangeLow)}–{formatCurrency(info.costRangeHigh)}
              </p>
            </div>

            <div className="bg-white/20 rounded-lg px-4 py-2">
              <p className="text-sm text-white/80">Daily transport</p>
              <p className="text-2xl font-bold">
                {formatCurrency(info.dailyCostRange.low)}–{formatCurrency(info.dailyCostRange.high)}
              </p>
            </div>

            {budget > 0 && (
              <div className="bg-white/20 rounded-lg px-4 py-2">
                <p className="text-sm text-white/80">Your budget allocation</p>
                <p className="text-2xl font-bold">{formatCurrency(budget)}</p>
              </div>
            )}
          </div>

          {info.isEstimate && (
            <p className="mt-4 text-sm text-white/70">
              * These are general estimates. {info.cityName} was not found in our city database.
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Transport Options */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">Transport Options</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {linkSections.map((section) => (
            <div
              key={section.title}
              className={`${section.color} border rounded-xl p-5`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{section.icon}</span>
                <h3 className="font-semibold text-gray-900">{section.title}</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">{section.description}</p>
              {section.link.url ? (
                <a
                  href={section.link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-purple-700 font-medium text-sm hover:underline"
                >
                  {section.link.label}
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ) : (
                <span className="text-sm text-gray-400">{section.link.label}</span>
              )}
            </div>
          ))}
        </div>

        {/* Tips */}
        {info.tips.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Local Tips</h2>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <ul className="space-y-3">
                {info.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-purple-500 mt-0.5 flex-shrink-0">*</span>
                    <span className="text-gray-700">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Budget Context */}
        {budget > 0 && (
          <div className="mb-8 bg-purple-50 rounded-xl border border-purple-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-2">Your Transport Budget</h2>
            <p className="text-gray-700 text-sm">
              Your trip has <strong>{formatCurrency(budget)}</strong> allocated for local transport.
              {info.costRangeLow <= budget ? (
                <> The low end of the estimated range ({formatCurrency(info.costRangeLow)}) fits within your budget.
                  {info.costRangeHigh > budget
                    ? ` To stay within budget, favor public transit over taxis and ride-hailing.`
                    : ` Even the high end ({formatCurrency(info.costRangeHigh)}) is within your allocation.`}
                </>
              ) : (
                <> The estimated range starts at {formatCurrency(info.costRangeLow)}, which exceeds your allocation. Consider using public transit exclusively to reduce costs.</>
              )}
            </p>
          </div>
        )}

        {/* Back CTA */}
        <div className="text-center">
          <button
            onClick={handleBack}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Trip Results
          </button>
        </div>
      </div>
    </div>
  );
}
