import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Paperclip, Trash2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ChatMessage, QuickSuggestion } from "./types";
import { MessageBubble } from "./MessageBubble";

const quickSuggestions: QuickSuggestion[] = [
  { label: "Resumir tabla", prompt: "Resume los datos principales de la tabla actual" },
  { label: "Analizar tendencias", prompt: "Analiza las tendencias que observas en los datos" },
  { label: "Top empresas", prompt: "¿Cuáles son las empresas con mejor puntuación?" },
];

const mockResponses = [
  "Analizando los datos de la tabla, puedo ver que tienes **8 empresas** registradas en el proyecto Vitivinícola 2025. La mayoría se encuentran en estado 'Longlist' con puntuaciones que varían entre 6.5 y 9.2.",
  "Las tendencias principales que observo son:\n\n1. **Concentración geográfica**: La mayoría de empresas están en Mendoza y La Rioja\n2. **Puntuaciones altas**: El promedio está por encima de 7.0\n3. **Diversificación**: Hay una buena mezcla de bodegas tradicionales y modernas",
  "Basándome en los datos, las empresas con mejor puntuación son:\n\n🥇 **Bodega Catena Zapata** - 9.2\n🥈 **Trapiche** - 8.8\n🥉 **Luigi Bosca** - 8.5\n\nEstas bodegas destacan por su producción premium y exportación internacional.",
  "Entendido. ¿Hay algo más específico que te gustaría saber sobre los datos del proyecto?",
];

interface AIChatSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AIChatSidebar({ collapsed, onToggle }: AIChatSidebarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "¡Hola! Soy tu asistente de IA. Pregúntame sobre los datos de este proyecto o usa las sugerencias rápidas para comenzar.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: randomResponse,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "¡Hola! Soy tu asistente de IA. Pregúntame sobre los datos de este proyecto o usa las sugerencias rápidas para comenzar.",
        timestamp: new Date(),
      },
    ]);
  };

  if (collapsed) {
    return (
      <div className="flex-shrink-0 border-l border-border bg-background">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="m-2"
        >
          <Sparkles className="h-4 w-4 text-primary" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 w-[380px] border-l border-border bg-background flex flex-col h-screen">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-border flex items-center justify-between bg-[hsl(var(--header-background))]">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Asistente IA</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleClearChat}
          >
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onToggle}
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        <div className="py-4 space-y-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {isTyping && (
            <div className="flex gap-2">
              <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-primary/10 text-primary">
                <Sparkles className="h-3 w-3" />
              </div>
              <div className="bg-muted/50 px-3 py-2 rounded-lg">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick Suggestions */}
      <div className="flex-shrink-0 px-4 py-2 border-t border-border">
        <div className="flex flex-wrap gap-1.5">
          {quickSuggestions.map((suggestion) => (
            <button
              key={suggestion.label}
              onClick={() => handleSend(suggestion.prompt)}
              className="px-2.5 py-1 text-xs rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
            >
              {suggestion.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 p-4 border-t border-border">
        <div className="relative bg-muted/30 rounded-xl shadow-sm border border-border focus-within:border-primary/50 transition-colors">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pregúntame sobre los datos de este proyecto..."
            className="min-h-[44px] max-h-[120px] resize-none border-0 bg-transparent pr-20 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
            rows={1}
          />
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              className="h-7 w-7 rounded-lg"
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          El asistente puede cometer errores. Verifica la información importante.
        </p>
      </div>
    </div>
  );
}
