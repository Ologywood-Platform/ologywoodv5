import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";
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
        "Hi! I'm Ologywood's AI support assistant. Ask me anything about bookings, tickets, fan clubs, music, payments, or any platform feature.",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    "How do I book an artist?",
    "What are the fees?",
    "How do fan clubs work?",
    "How do I sell tickets?",
  ];

  const handleSuggestedTopic = (topic: string) => {
    setInputValue(topic);
  };

  const chatWindowWidth = isMobile ? "calc(100vw - 1rem)" : "w-96";
  const chatWindowMaxHeight = isMobile ? "max-h-[70vh]" : "max-h-[600px]";
  const buttonBottom = isMobile ? "bottom-4" : "bottom-6";
  const buttonRight = isMobile ? "right-4" : "right-6";
  const chatWindowBottom = isMobile ? "bottom-20" : "bottom-24";
  const chatWindowRight = isMobile ? "right-2" : "right-6";

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed ${buttonBottom} ${buttonRight} bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all z-[60] flex items-center justify-center hover:scale-110`}
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
        <div
          className={`fixed ${chatWindowBottom} ${chatWindowRight} ${chatWindowWidth} ${chatWindowMaxHeight} bg-white rounded-lg shadow-2xl flex flex-col z-[60] border border-gray-200 overflow-hidden`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-t-lg flex-shrink-0">
            <h3 className="font-semibold text-lg">Ologywood Support</h3>
            <p className="text-sm text-purple-100">AI-powered assistance 24/7</p>
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
