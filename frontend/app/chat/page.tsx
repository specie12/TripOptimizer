import type { Metadata } from 'next';
import ChatInterface from '../../components/ChatInterface';

export const metadata: Metadata = {
  title: 'Chat - TripOptimizer',
  description: 'Plan your trip with our AI travel assistant',
};

export default function ChatPage() {
  return (
    <div className="py-8">
      <div className="max-w-3xl mx-auto mb-6 text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Plan Your Trip with AI
        </h1>
        <p className="text-gray-500 mt-2 text-sm">
          Tell me where you want to go and I&apos;ll find the best options for you
        </p>
      </div>
      <ChatInterface mode="fullpage" />
    </div>
  );
}
