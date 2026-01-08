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
          {/* Header */}
          <header className="bg-white border-b border-gray-200">
            <div className="max-w-4xl mx-auto px-4 py-4">
              <a href="/" className="text-xl font-bold text-blue-600">
                TripOptimizer
              </a>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
