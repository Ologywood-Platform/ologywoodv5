import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, AlertCircle } from "lucide-react";
import { trpc } from "../lib/trpc";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "👋 Hi! I'm Ologywood's AI support assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sendMessageMutation = trpc.aiChat.sendMessage.useMutation();
  const topicsQuery = trpc.aiChat.getSuggestedTopics.useQuery();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await sendMessageMutation.mutateAsync({
        message: inputValue,
        conversationHistory: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      // Add assistant response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // If escalation needed, show notification
      if (response.shouldEscalate) {
        setTimeout(() => {
          const escalationMsg: Message = {
            id: (Date.now() + 2).toString(),
            role: "assistant",
            content: `🔔 A support agent will be with you shortly. Your issue: "${response.escalationReason}"`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, escalationMsg]);
        }, 1000);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Sorry, I encountered an error. Please try again or contact support.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedTopic = (topic: string) => {
    setInputValue(topic);
  };

  // Calculate chat window dimensions based on screen size
  const chatWindowWidth = isMobile ? "calc(100vw - 1rem)" : "w-96";
  const chatWindowMaxHeight = isMobile ? "max-h-[70vh]" : "max-h-[600px]";
  const buttonBottom = isMobile ? "bottom-4" : "bottom-6";
  const buttonRight = isMobile ? "right-4" : "right-6";
  const chatWindowBottom = isMobile ? "bottom-20" : "bottom-24";
  const chatWindowRight = isMobile ? "right-2" : "right-6";

  return (
    <>
      {/* Chat Button - Positioned to the right */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed ${buttonBottom} ${buttonRight} bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all z-40 flex items-center justify-center hover:scale-110`}
        aria-label="Open chat"
        title="Chat with AI Support"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed ${chatWindowBottom} ${chatWindowRight} ${chatWindowWidth} ${chatWindowMaxHeight} bg-white rounded-lg shadow-2xl flex flex-col z-40 border border-gray-200 overflow-hidden`}>
          {/* Header - Fixed height to prevent text cutoff */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-t-lg flex-shrink-0">
            <h3 className="font-semibold text-lg whitespace-nowrap overflow-hidden text-overflow-ellipsis">
              Ologywood Support
            </h3>
            <p className="text-sm text-purple-100 whitespace-nowrap overflow-hidden text-overflow-ellipsis">
              💡 AI-powered assistance 24/7
            </p>
          </div>

          {/* Messages - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg break-words ${
                    message.role === "user"
                      ? "bg-purple-600 text-white rounded-br-none"
                      : "bg-gray-100 text-gray-900 rounded-bl-none"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      message.role === "user"
                        ? "text-purple-100"
                        : "text-gray-500"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg rounded-bl-none">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Suggested Topics - Show only if no user messages */}
            {messages.length === 1 && topicsQuery.data && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2 font-semibold whitespace-nowrap">
                  Popular topics:
                </p>
                <div className="space-y-2">
                  {topicsQuery.data.slice(0, 4).map((topic, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestedTopic(topic.topic)}
                      className="w-full text-left text-sm px-3 py-2 rounded bg-gray-50 hover:bg-purple-50 transition-colors text-gray-700 hover:text-purple-700 break-words"
                    >
                      {topic.icon} {topic.topic}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input - Fixed at bottom */}
          <form
            onSubmit={handleSendMessage}
            className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-lg flex-shrink-0"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your question..."
                disabled={isLoading}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 text-sm"
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors flex items-center justify-center flex-shrink-0"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 break-words">
              💡 Tip: Type "help" or ask any question about bookings, payments, or riders
            </p>
          </form>
        </div>
      )}
    </>
  );
}
