import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Brain,
  Send,
  Sparkles,
  Clock,
  Pin,
  Copy,
  CheckCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { format } from "date-fns";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isPinned?: boolean;
}

export function AiChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I'm your AI business assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response - Replace with actual API call
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Based on your recent sales data, I notice your gaming accessories have a 23% higher margin. Consider creating a bundle deal with your best-selling items to increase average order value.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const togglePin = (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, isPinned: !msg.isPinned } : msg
      )
    );
  };

  const copyMessage = (messageId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b">
        <h3 className="font-semibold">AI Business Assistant</h3>
        <p className="text-sm text-muted-foreground">
          Your personal business advisor
        </p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <TooltipProvider>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "group relative flex gap-3 rounded-lg p-4 transition-colors",
                  message.role === "assistant" ? "bg-muted/50" : "bg-primary/5",
                  message.isPinned && "border-2 border-primary/20"
                )}
              >
                {message.role === "assistant" ? (
                  <Brain className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                ) : (
                  <div className="h-5 w-5 rounded-full bg-primary/10 shrink-0" />
                )}

                <div className="flex-1 space-y-1">
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {format(message.timestamp, "HH:mm")}
                  </div>
                </div>

                {/* Message Actions */}
                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => togglePin(message.id)}
                      >
                        <Pin
                          className={cn(
                            "h-4 w-4",
                            message.isPinned && "text-primary"
                          )}
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {message.isPinned ? "Unpin message" : "Pin message"}
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => copyMessage(message.id, message.content)}
                      >
                        {copiedId === message.id ? (
                          <CheckCheck className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {copiedId === message.id ? "Copied!" : "Copy message"}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground p-4">
                <Sparkles className="h-4 w-4 animate-pulse" />
                <span className="text-sm">AI is thinking...</span>
              </div>
            )}
          </div>
        </TooltipProvider>
      </ScrollArea>

      {/* Input Area - Fixed at bottom */}
      <div className="border-t p-4 bg-background">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your business..."
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1"
          />
          <Button onClick={handleSend} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
