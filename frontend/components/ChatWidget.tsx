'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import ChatInterface from './ChatInterface';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Hide widget on the dedicated chat page
  if (pathname === '/chat') return null;

  return (
    <>
      {/* Floating chat drawer */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[380px] rounded-2xl shadow-2xl border border-gray-200 bg-gray-50 z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 flex items-center justify-between">
            <span className="text-white font-semibold text-sm">Trip Planner Chat</span>
            <div className="flex items-center gap-2">
              <a
                href="/chat"
                className="text-white/80 hover:text-white text-xs underline underline-offset-2 transition-colors"
              >
                Full page
              </a>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Chat body */}
          <ChatInterface mode="widget" onClose={() => setIsOpen(false)} />
        </div>
      )}

      {/* Floating bubble button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all z-50 flex items-center justify-center"
          aria-label="Open trip planner chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </>
  );
}
