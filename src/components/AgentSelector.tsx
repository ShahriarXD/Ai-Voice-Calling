import type { Tables } from "@/integrations/supabase/types";
import { Bot, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

type Agent = Tables<"agents">;

interface AgentSelectorProps {
  agents: Agent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function AgentSelector({ agents, selectedId, onSelect }: AgentSelectorProps) {
  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <Bot className="h-10 w-10 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">No agents yet. Create one first.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-1 p-2">
        {agents.map((agent) => {
          const active = agent.id === selectedId;
          return (
            <button
              key={agent.id}
              onClick={() => onSelect(agent.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition-colors ${
                active
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-muted text-foreground"
              }`}
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="font-medium truncate">{agent.name}</p>
                <p className="text-xs text-muted-foreground truncate capitalize">{agent.business_type}</p>
              </div>
              {active && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
