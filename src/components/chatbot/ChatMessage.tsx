import { Bot, User, ThumbsUp, ThumbsDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

interface ChatMessageProps {
  msg: Msg;
  index: number;
  onFeedback?: (index: number, feedback: "up" | "down") => void;
  feedback?: "up" | "down" | null;
}

export function ChatMessage({ msg, index, onFeedback, feedback }: ChatMessageProps) {
  const [hovering, setHovering] = useState(false);

  return (
    <div
      className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {msg.role === "assistant" && (
        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
          <Bot className="h-3.5 w-3.5 text-primary" />
        </div>
      )}
      <div className="flex flex-col gap-1 max-w-[80%]">
        <div
          className={cn(
            "px-3 py-2 rounded-xl text-sm",
            msg.role === "user"
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted text-foreground rounded-bl-md"
          )}
        >
          {msg.role === "assistant" ? (
            <div className="prose prose-sm max-w-none [&_p]:m-0 [&_ul]:my-1 [&_li]:my-0 [&_a]:text-primary [&_a]:underline">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          ) : (
            msg.content
          )}
        </div>
        {/* Feedback buttons for assistant messages */}
        {msg.role === "assistant" && onFeedback && (hovering || feedback) && (
          <div className="flex gap-1 ml-1">
            <button
              onClick={() => onFeedback(index, "up")}
              className={cn(
                "p-1 rounded hover:bg-muted transition-colors",
                feedback === "up" ? "text-primary" : "text-muted-foreground"
              )}
              title="Helpful"
            >
              <ThumbsUp className="h-3 w-3" />
            </button>
            <button
              onClick={() => onFeedback(index, "down")}
              className={cn(
                "p-1 rounded hover:bg-muted transition-colors",
                feedback === "down" ? "text-destructive" : "text-muted-foreground"
              )}
              title="Not helpful"
            >
              <ThumbsDown className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
      {msg.role === "user" && (
        <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
          <User className="h-3.5 w-3.5 text-primary-foreground" />
        </div>
      )}
    </div>
  );
}
