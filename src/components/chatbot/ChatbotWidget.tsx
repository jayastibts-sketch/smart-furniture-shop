import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, Loader2, Trash2, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ChatMessage } from "./ChatMessage";
import { VoiceInput } from "./VoiceInput";
import { ChatHistory } from "./ChatHistory";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const quickActions = [
  "What products do you have?",
  "Help me choose furniture",
  "What wood types are available?",
  "Shipping & delivery info",
  "How to track my order?",
];

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Record<number, "up" | "down">>({});
  const [showHistory, setShowHistory] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current && !showHistory) {
      inputRef.current.focus();
    }
  }, [isOpen, showHistory]);

  const saveConversation = useCallback(async (msgs: Msg[]) => {
    if (!user || msgs.length < 2) return;
    try {
      let convId = conversationId;
      if (!convId) {
        const title = msgs[0].content.slice(0, 60) || "New Chat";
        const { data } = await supabase
          .from("chat_conversations")
          .insert({ user_id: user.id, title })
          .select("id")
          .single();
        if (data) {
          convId = data.id;
          setConversationId(convId);
        }
      } else {
        await supabase.from("chat_conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);
      }

      if (convId) {
        // Save last 2 messages (user + assistant)
        const newMsgs = msgs.slice(-2);
        await supabase.from("chat_messages").insert(
          newMsgs.map((m) => ({
            conversation_id: convId!,
            role: m.role,
            content: m.content,
          }))
        );
      }
    } catch (e) {
      console.error("Failed to save conversation:", e);
    }
  }, [user, conversationId]);

  const handleFeedback = useCallback(async (index: number, feedback: "up" | "down") => {
    setFeedbacks((prev) => ({ ...prev, [index]: feedback }));
    // Save feedback to DB if we have a conversation
    if (conversationId && user) {
      const { data: msgs } = await supabase
        .from("chat_messages")
        .select("id")
        .eq("conversation_id", conversationId)
        .eq("role", "assistant")
        .order("created_at", { ascending: true });
      // Find matching message by counting assistant messages up to this index
      const assistantIndices = messages.reduce<number[]>((acc, m, i) => m.role === "assistant" ? [...acc, i] : acc, []);
      const assistantOrder = assistantIndices.indexOf(index);
      if (msgs && msgs[assistantOrder]) {
        await supabase.from("chat_messages").update({ feedback }).eq("id", msgs[assistantOrder].id);
      }
    }
  }, [conversationId, user, messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";
    const allMessages = [...messages, userMsg];

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${resp.status}`);
      }
      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Save to DB after complete response
      const finalMessages = [...allMessages, { role: "assistant" as const, content: assistantSoFar }];
      saveConversation(finalMessages);
    } catch (e: any) {
      console.error("Chat error:", e);
      toast({ title: "Chat Error", description: e.message || "Failed to get response", variant: "destructive" });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I'm having trouble right now. Please try again in a moment! 😊" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setFeedbacks({});
    setConversationId(null);
    setShowHistory(false);
  };

  const loadConversation = (id: string, msgs: Msg[]) => {
    setConversationId(id);
    setMessages(msgs);
    setFeedbacks({});
    setShowHistory(false);
  };

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
          >
            <MessageCircle className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-6rem)] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                <div>
                  <h3 className="font-semibold text-sm">Guna Woodcraft Assistant</h3>
                  <p className="text-xs opacity-80">AI-powered • Always here to help</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {user && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
                    onClick={() => setShowHistory(!showHistory)}
                    title="Chat history"
                  >
                    <History className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
                  onClick={startNewChat}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* History view */}
            {showHistory && user ? (
              <ChatHistory
                userId={user.id}
                onSelectConversation={loadConversation}
                onNewChat={startNewChat}
                onBack={() => setShowHistory(false)}
              />
            ) : (
              <>
                {/* Messages */}
                <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                  {messages.length === 0 && (
                    <div className="text-center py-6">
                      <Bot className="h-10 w-10 mx-auto text-primary/40 mb-3" />
                      <p className="text-sm font-medium text-foreground mb-1">Welcome! 👋</p>
                      <p className="text-xs text-muted-foreground mb-4">
                        I can help you find furniture, answer questions, or track orders.
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {quickActions.map((q) => (
                          <button
                            key={q}
                            onClick={() => sendMessage(q)}
                            className="text-xs px-3 py-1.5 rounded-full border border-border bg-muted/50 text-foreground hover:bg-primary/10 hover:border-primary/30 transition-colors"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {messages.map((msg, i) => (
                      <ChatMessage
                        key={i}
                        msg={msg}
                        index={i}
                        onFeedback={handleFeedback}
                        feedback={feedbacks[i] || null}
                      />
                    ))}
                    {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                      <div className="flex gap-2 items-center">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="bg-muted px-3 py-2 rounded-xl rounded-bl-md">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="px-3 py-3 border-t border-border shrink-0">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendMessage(input);
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask me anything..."
                      className="flex-1 h-9 text-sm"
                      disabled={isLoading}
                    />
                    <VoiceInput
                      onTranscript={(text) => sendMessage(text)}
                      disabled={isLoading}
                    />
                    <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={isLoading || !input.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
