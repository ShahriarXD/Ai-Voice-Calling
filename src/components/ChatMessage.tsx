import { format } from "date-fns";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  agentName?: string;
}

export default function ChatMessage({ role, content, timestamp, agentName }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-accent text-accent-foreground"
        }`}
      >
        {isUser ? "You" : agentName?.[0]?.toUpperCase() ?? "AI"}
      </div>
      <div className={`max-w-[75%] space-y-1 ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-card border border-border text-card-foreground rounded-bl-md"
          }`}
        >
          {isUser ? (
            content
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert [&>p]:m-0">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          )}
        </div>
        {timestamp && (
          <p className={`text-[10px] text-muted-foreground px-1 ${isUser ? "text-right" : "text-left"}`}>
            {format(new Date(timestamp), "h:mm a")}
          </p>
        )}
      </div>
    </div>
  );
}
