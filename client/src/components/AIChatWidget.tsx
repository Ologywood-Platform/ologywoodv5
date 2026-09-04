import React, { createContext, useCallback, useContext, useMemo, useState, useRef, useEffect } from "react";
import { Sparkles, X, Send } from "lucide-react";
import { trpc } from "../lib/trpc";

type AIChatContextValue = {
  isOpen: boolean;
  toggleChat: () => void;
  closeChat: () => void;
};

const AIChatContext = createContext<AIChatContextValue | null>(null);

export function AIChatProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const toggleChat = useCallback(() => setIsOpen((open) => !open), []);
  const closeChat = useCallback(() => setIsOpen(false), []);
  const value = useMemo(() => ({ isOpen, toggleChat, closeChat }), [closeChat, isOpen, toggleChat]);

  return (
    <AIChatContext.Provider value={value}>
      {children}
    </AIChatContext.Provider>
  );
}

function useAIChat() {
  const context = useContext(AIChatContext);
  if (!context) throw new Error('AI chat must be rendered inside AIChatProvider');
  return context;
}

export function AIChatTrigger({ className = '' }: { className?: string }) {
  const { isOpen, toggleChat } = useAIChat();

  return (
    <button
      type="button"
      onClick={toggleChat}
      className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-purple-600 transition-colors hover:bg-purple-50 hover:text-purple-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 dark:text-purple-300 dark:hover:bg-purple-900/30 dark:hover:text-purple-200 ${className}`}
      aria-label={isOpen ? 'Close OlogyWood AI chat' : 'Open OlogyWood AI chat'}
      aria-expanded={isOpen}
      aria-controls="ologywood-ai-chat-panel"
      title="Ask OlogyWood AI"
      data-testid="ologywood-ai-header-trigger"
    >
      <Sparkles className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function AIChatWidget() {
  const { isOpen, closeChat } = useAIChat();
  const [isMobile, setIsMobile] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hi! I'm Ologywood's AI support assistant. Ask me anything about bookings, tickets, fan clubs, music, payments, or any platform feature.",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sendMessageMutation = trpc.aiChat.sendMessage.useMutation();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!isOpen) return;
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 100);
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeChat();
    };
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [closeChat, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputValue.trim();
    setInputValue("");
    setIsLoading(true);

    try {
      // Build history from existing messages (exclude the initial greeting)
      const history = messages
        .filter((m) => m.id !== "1")
        .map((m) => ({ role: m.role, content: m.content }));

      const result = await sendMessageMutation.mutateAsync({
        message: currentInput,
        history,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: result.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I'm having trouble connecting right now. Please try again or visit our Help Center at /help for answers.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    "How do I book an athlete?",
    "What is the NIL contract?",
    "How do fan clubs work?",
    "How do I upload highlight clips?",
    "What are the fees?",
    "How do I sell tickets?",
  ];

  const handleSuggestedTopic = (topic: string) => {
    setInputValue(topic);
  };

  const chatWindowWidth = isMobile ? "w-[calc(100vw-1rem)]" : "w-96";
  const chatWindowMaxHeight = isMobile ? "max-h-[70vh]" : "max-h-[600px]";
  const chatWindowTop = isMobile ? "top-[calc(env(safe-area-inset-top,0px)+4.5rem)]" : "top-20";
  const chatWindowRight = isMobile ? "right-2" : "right-6";

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div
          id="ologywood-ai-chat-panel"
          role="dialog"
          aria-labelledby="ologywood-ai-chat-title"
          className={`fixed ${chatWindowTop} ${chatWindowRight} ${chatWindowWidth} ${chatWindowMaxHeight} bg-white rounded-lg shadow-2xl flex flex-col z-[60] border border-gray-200 overflow-hidden`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-t-lg flex-shrink-0 flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2" id="ologywood-ai-chat-title">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
                OlogyWood AI
              </h3>
              <p className="text-sm text-purple-100">Platform guidance, 24/7</p>
            </div>
            <button
              type="button"
              onClick={closeChat}
              className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-white hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Close OlogyWood AI chat"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {/* Messages */}
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

            {/* Suggested Questions - show only when there's just the greeting */}
            {messages.length === 1 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 font-medium">Quick questions:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSuggestedTopic(q)}
                      className="text-xs bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full border border-purple-200 hover:bg-purple-100 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSendMessage}
            className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-lg flex-shrink-0"
          >
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask a question..."
                disabled={isLoading}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 text-sm"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg disabled:bg-gray-400 transition-colors flex items-center justify-center flex-shrink-0 hover:bg-purple-700"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
