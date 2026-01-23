/**
 * LoadingCard - Skeleton Loader for Trip Cards (Phase 11)
 *
 * Displays animated skeleton while fetching trip options.
 * Features gradient shimmer effect.
 */

export default function LoadingCard() {
  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 animate-pulse">
      {/* Header Skeleton */}
      <div className="p-6 pb-4 bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex justify-between items-start mb-3">
          <div className="h-8 bg-gray-300 rounded w-48"></div>
          <div className="h-8 bg-gray-300 rounded-full w-24"></div>
        </div>
        <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
        <div className="h-10 bg-gray-300 rounded w-32"></div>
      </div>

      {/* Cost Breakdown Skeleton */}
      <div className="p-6 border-t border-gray-100">
        <div className="h-6 bg-gray-300 rounded w-40 mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-gray-100 rounded-lg p-4 h-24"></div>
          ))}
        </div>
      </div>

      {/* Highlights Skeleton */}
      <div className="p-6 border-t border-gray-100">
        <div className="h-6 bg-gray-300 rounded w-40 mb-4"></div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 bg-gray-200 rounded-full w-32"></div>
          ))}
        </div>
      </div>

      {/* Trip Type Skeleton */}
      <div className="px-6 pb-6">
        <div className="bg-gray-50 rounded-lg p-4 h-20"></div>
      </div>

      {/* Button Skeleton */}
      <div className="px-6 pb-6">
        <div className="h-12 bg-gray-300 rounded-xl w-full"></div>
      </div>

      {/* Booking Actions Skeleton */}
      <div className="px-6 pb-6 border-t border-gray-100 pt-6">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[140px] h-12 bg-gray-300 rounded-lg"></div>
          <div className="flex-1 min-w-[140px] h-12 bg-gray-300 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
}

/**
 * Shimmer effect for loading animation
 * Add this to your globals.css for the shimmer effect:
 *
 * @keyframes shimmer {
 *   0% { background-position: -1000px 0; }
 *   100% { background-position: 1000px 0; }
 * }
 *
 * .animate-shimmer {
 *   animation: shimmer 2s infinite linear;
 *   background: linear-gradient(to right, #f0f0f0 4%, #e0e0e0 25%, #f0f0f0 36%);
 *   background-size: 1000px 100%;
 * }
 */
