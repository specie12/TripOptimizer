import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'TripOptimizer - Find trips that fit your budget',
  description: 'Plan your next trip with budget clarity and flexibility',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-gray-50`}>
        <div className="min-h-screen">
          {/* Header - Phase 10: Purple gradient accent */}
          <header className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-6xl mx-auto px-4 py-4">
              <a
                href="/"
                className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                TripOptimizer
              </a>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-6xl mx-auto px-4">{children}</main>
        </div>
      </body>
    </html>
  );
}
