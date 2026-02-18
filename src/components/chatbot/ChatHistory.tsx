import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Plus, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface ChatHistoryProps {
  userId: string;
  onSelectConversation: (id: string, messages: { role: "user" | "assistant"; content: string }[]) => void;
  onNewChat: () => void;
  onBack: () => void;
}

export function ChatHistory({ userId, onSelectConversation, onNewChat, onBack }: ChatHistoryProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, [userId]);

  const loadConversations = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("chat_conversations")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(20);
    setConversations(data || []);
    setLoading(false);
  };

  const selectConversation = async (conv: Conversation) => {
    const { data: messages } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: true });
    onSelectConversation(conv.id, (messages as any) || []);
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from("chat_conversations").delete().eq("id", id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <Button size="sm" variant="ghost" onClick={onNewChat} className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" /> New Chat
        </Button>
      </div>
      <ScrollArea className="flex-1 p-2">
        {loading ? (
          <p className="text-xs text-muted-foreground text-center py-4">Loading...</p>
        ) : conversations.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No previous chats</p>
        ) : (
          <div className="space-y-1">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted/80 transition-colors group flex items-center justify-between"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{conv.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => deleteConversation(conv.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-all"
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </button>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
