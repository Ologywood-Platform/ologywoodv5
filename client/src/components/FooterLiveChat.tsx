import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'support';
  message: string;
  timestamp: Date;
}

export const FooterLiveChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'support',
      message: 'Hi! 👋 Welcome to Ologywood support. How can we help you today?',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      message: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate support response
    setTimeout(() => {
      const supportMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'support',
        message: generateSupportResponse(inputValue),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, supportMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const generateSupportResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('booking') || lowerMessage.includes('book')) {
      return 'To book an artist or venue, simply browse our directory, click "Book", and fill out the booking form. If you need help, check our Help Center or I can guide you through it!';
    }
    if (lowerMessage.includes('payment') || lowerMessage.includes('price')) {
      return 'We accept all major credit cards and process payments securely through Stripe. Artists are paid within 48 hours of event completion.';
    }
    if (lowerMessage.includes('cancel') || lowerMessage.includes('refund')) {
      return 'Cancellations are allowed up to 7 days before the event with a full refund. After that, a 50% cancellation fee applies. Need more details?';
    }
    if (lowerMessage.includes('verify') || lowerMessage.includes('verification')) {
      return 'Verification helps build trust on our platform. Artists can verify through reviews and completed bookings. Venues can verify through business registration.';
    }
    if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
      return 'I\'m here to help! You can ask me about bookings, payments, verification, or any other questions. Or visit our Help Center for more resources.';
    }
    return 'Great question! I\'m here to help. Could you provide more details so I can assist you better?';
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 z-40"
        aria-label="Open live chat"
      >
        <MessageCircle size={24} />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 left-6 bg-white rounded-lg shadow-2xl w-96 max-w-[calc(100vw-2rem)] z-50 border border-gray-200 flex flex-col max-h-96">
          {/* Header */}
          <div className="bg-indigo-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <div>
              <h3 className="font-semibold">Live Chat Support</h3>
              <p className="text-xs text-indigo-100">We typically reply within 2 minutes</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-indigo-700 p-1 rounded transition-colors"
              aria-label="Close chat"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-900 rounded-bl-none'
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                  <p
                    className={`text-xs mt-1 ${
                      msg.sender === 'user' ? 'text-indigo-100' : 'text-gray-500'
                    }`}
                  >
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg rounded-bl-none">
                  <Loader size={16} className="animate-spin" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSendMessage}
            className="border-t p-4 flex gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-md p-2 transition-colors"
              aria-label="Send message"
            >
              <Send size={20} />
            </button>
          </form>

          {/* Quick Actions */}
          <div className="border-t p-3 bg-gray-50 rounded-b-lg">
            <p className="text-xs text-gray-600 mb-2">Quick help:</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setInputValue('How do I book?')}
                className="text-xs bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-100"
              >
                How to book
              </button>
              <button
                onClick={() => setInputValue('What are your fees?')}
                className="text-xs bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-100"
              >
                Fees
              </button>
              <button
                onClick={() => setInputValue('How do I verify?')}
                className="text-xs bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-100"
              >
                Verification
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FooterLiveChat;
