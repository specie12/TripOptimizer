'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ChatMessage, ExtractedTripParams } from '../lib/types';
import { sendChatMessage } from '../lib/api';

interface ChatInterfaceProps {
  mode: 'widget' | 'fullpage';
  onClose?: () => void;
  /** When provided, ChatInterface uses this external state instead of its own useState. */
  messages?: ChatMessage[];
  setMessages?: (update: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: "Hi! I'm your travel planning assistant. Tell me about the trip you're dreaming of — where you'd like to go, your budget, how long, and I'll find the best options for you!",
  timestamp: new Date(),
};

function redirectToResults(params: ExtractedTripParams, router: ReturnType<typeof useRouter>) {
  const budgetDollars = Math.round(params.budgetTotal / 100);
  const searchParams = new URLSearchParams({
    budget: budgetDollars.toString(),
    originCity: params.originCity,
    days: params.numberOfDays.toString(),
    style: params.travelStyle,
  });

  if (params.destination) searchParams.set('destination', params.destination);
  if (params.startDate) searchParams.set('startDate', params.startDate);
  if (params.tripPace) searchParams.set('pace', params.tripPace);
  if (params.accommodationType) searchParams.set('accommodation', params.accommodationType);
  if (params.interests && params.interests.length > 0) searchParams.set('interests', params.interests.join(','));
  if (params.numberOfTravelers) searchParams.set('travelers', params.numberOfTravelers.toString());

  router.push(`/results?${searchParams.toString()}`);
}

export default function ChatInterface({ mode, onClose, messages: externalMessages, setMessages: externalSetMessages }: ChatInterfaceProps) {
  const router = useRouter();
  const [internalMessages, internalSetMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const messages = externalMessages ?? internalMessages;
  const setMessages = externalSetMessages ?? internalSetMessages;
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  async function handleSend() {
    const text = inputValue.trim();
    if (!text || isLoading || isRedirecting) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Build conversation history excluding the welcome message
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await sendChatMessage({
        message: text,
        conversationHistory: history,
      });

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (response.status === 'ready' && response.extractedParams) {
        setIsRedirecting(true);
        setTimeout(() => {
          redirectToResults(response.extractedParams!, router);
        }, 1500);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const containerClass =
    mode === 'widget'
      ? 'flex flex-col h-[500px] w-full'
      : 'flex flex-col max-w-3xl mx-auto min-h-[calc(100vh-200px)]';

  return (
    <div className={containerClass}>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl rounded-br-md ml-auto'
                  : 'bg-white border border-gray-200 rounded-2xl rounded-bl-md mr-auto shadow-sm text-gray-800'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md shadow-sm px-4 py-3 mr-auto">
              <div className="flex space-x-1.5">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* Redirect notice */}
        {isRedirecting && (
          <div className="flex justify-center">
            <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-2.5 text-sm text-purple-700">
              Finding your perfect trip options...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 p-3 bg-white">
        <div className="flex items-end gap-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell me about your dream trip..."
            rows={1}
            disabled={isRedirecting}
            className="flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading || isRedirecting}
            className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center justify-center disabled:opacity-40 hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M3.105 2.29a.75.75 0 00-.826.95l1.414 4.924A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.924a.75.75 0 00.826.95l15.25-6.25a.75.75 0 000-1.42L3.105 2.29z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
