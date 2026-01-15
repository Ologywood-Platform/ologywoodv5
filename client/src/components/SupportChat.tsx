import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, X, Send, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  sender: 'user' | 'support';
  message: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
}

interface SupportChatProps {
  userId?: number;
  userName?: string;
  userEmail?: string;
  onClose?: () => void;
}

const QUICK_REPLIES = [
  'How do I create a rider?',
  'How do I compare riders?',
  'How do I propose modifications?',
  'I need help with my booking',
  'Report a technical issue',
];

const SUPPORT_HOURS = {
  start: 9,
  end: 18,
  timezone: 'EST',
  days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
};

export function SupportChat({ userId, userName, userEmail, onClose }: SupportChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'support',
      message: 'Hello! 👋 Welcome to Ologywood Support. How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if support is online
  useEffect(() => {
    const checkSupportHours = () => {
      const now = new Date();
      const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
      const hour = now.getHours();

      const isWithinHours =
        SUPPORT_HOURS.days.includes(dayName) &&
        hour >= SUPPORT_HOURS.start &&
        hour < SUPPORT_HOURS.end;

      setIsOnline(isWithinHours);
    };

    checkSupportHours();
    const interval = setInterval(checkSupportHours, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      message: text,
      timestamp: new Date(),
      status: 'sending',
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      // Update user message status
      setMessages(prev =>
        prev.map(msg =>
          msg.id === userMessage.id ? { ...msg, status: 'sent' } : msg
        )
      );

      // Add support response based on keywords
      let supportResponse = '';

      if (text.toLowerCase().includes('rider')) {
        supportResponse =
          'Great question about riders! Riders are detailed performance requirements that artists create. You can view and compare them when booking. Would you like help creating one or comparing existing riders?';
      } else if (text.toLowerCase().includes('modification')) {
        supportResponse =
          'Modifications allow venues to propose changes to rider requirements. You can propose modifications directly from the booking details page. The artist will review and can approve, counter-propose, or reject your changes.';
      } else if (text.toLowerCase().includes('booking')) {
        supportResponse =
          'I can help with booking questions! Are you having trouble creating a booking, selecting a rider, or something else? Let me know the specific issue and I\'ll assist.';
      } else if (text.toLowerCase().includes('technical') || text.toLowerCase().includes('error')) {
        supportResponse =
          'I\'m sorry you\'re experiencing a technical issue. Please describe what happened and I\'ll help troubleshoot. If needed, I can escalate this to our technical team.';
      } else {
        supportResponse =
          'Thanks for reaching out! I\'m here to help. Could you provide more details about what you need assistance with?';
      }

      const supportMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'support',
        message: supportResponse,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, supportMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleQuickReply = (reply: string) => {
    handleSendMessage(reply);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-colors"
        aria-label="Open support chat"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-h-[600px] flex flex-col bg-white rounded-lg shadow-2xl border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-5 w-5" />
          <div>
            <h3 className="font-semibold">Ologywood Support</h3>
            <p className="text-xs text-purple-100">
              {isOnline ? '🟢 Online' : '🔴 Offline'}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setIsOpen(false);
            onClose?.();
          }}
          className="hover:bg-purple-600 p-1 rounded transition-colors"
          aria-label="Close chat"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Support Hours Info */}
      {!isOnline && (
        <div className="bg-amber-50 border-b border-amber-200 p-3 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold">Support Hours</p>
            <p>Monday-Friday, 9 AM - 6 PM EST</p>
            <p className="text-xs mt-1">We'll respond to your message during business hours.</p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                msg.sender === 'user'
                  ? 'bg-purple-600 text-white rounded-br-none'
                  : 'bg-gray-100 text-gray-900 rounded-bl-none'
              }`}
            >
              <p className="text-sm">{msg.message}</p>
              <div className="flex items-center gap-1 mt-1">
                <p className="text-xs opacity-70">
                  {msg.timestamp.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                {msg.sender === 'user' && msg.status && (
                  <>
                    {msg.status === 'sending' && (
                      <Loader className="h-3 w-3 animate-spin opacity-70" />
                    )}
                    {msg.status === 'sent' && (
                      <CheckCircle className="h-3 w-3 opacity-70" />
                    )}
                    {msg.status === 'error' && (
                      <AlertCircle className="h-3 w-3 opacity-70" />
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg rounded-bl-none">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies */}
      {messages.length <= 2 && (
        <div className="border-t border-gray-200 p-3 space-y-2">
          <p className="text-xs text-gray-600 font-semibold">Quick questions:</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_REPLIES.slice(0, 3).map((reply, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickReply(reply)}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition-colors"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 p-3 flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage(inputValue);
            }
          }}
          placeholder="Type your message..."
          className="flex-1"
          disabled={isLoading}
        />
        <Button
          onClick={() => handleSendMessage(inputValue)}
          disabled={!inputValue.trim() || isLoading}
          size="sm"
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-gray-50 p-2 text-center text-xs text-gray-600 rounded-b-lg">
        <p>
          For urgent issues, email{' '}
          <a href="mailto:support@ologywood.com" className="text-purple-600 hover:underline">
            support@ologywood.com
          </a>
        </p>
      </div>
    </div>
  );
}
