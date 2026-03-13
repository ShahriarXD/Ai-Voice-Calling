import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import ChatMessage from "@/components/ChatMessage";
import AgentSelector from "@/components/AgentSelector";
import VoiceChat from "@/components/VoiceChat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, Loader2, Trash2, PanelLeftClose, PanelLeft, MessageSquare, Mic } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Agent = Tables<"agents">;
type Msg = { role: "user" | "assistant"; content: string; created_at: string };

export default function Demo() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(searchParams.get("agentId"));
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mode, setMode] = useState<"chat" | "voice">("chat");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  // Load agents
  useEffect(() => {
    if (!user) return;
    supabase
      .from("agents")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setAgents(data ?? []));
  }, [user]);

  // Load conversation history when agent changes
  useEffect(() => {
    if (!user || !selectedAgentId) { setMessages([]); return; }
    supabase
      .from("conversations")
      .select("*")
      .eq("user_id", user.id)
      .eq("agent_id", selectedAgentId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) {
          setMessages(data.map((d) => ({ role: d.role as "user" | "assistant", content: d.message, created_at: d.created_at })));
        }
      });
  }, [user, selectedAgentId]);

  // Auto scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const saveMessage = useCallback(async (role: string, content: string, agentId: string) => {
    if (!user) return;
    await supabase.from("conversations").insert({
      user_id: user.id,
      agent_id: agentId,
      message: content,
      role,
    });
  }, [user]);

  const clearConversation = async () => {
    if (!user || !selectedAgentId) return;
    await supabase.from("conversations").delete().eq("user_id", user.id).eq("agent_id", selectedAgentId);
    setMessages([]);
  };

  const sendMessage = async () => {
    if (!input.trim() || !selectedAgentId || isStreaming) return;
    const userMsg: Msg = { role: "user", content: input.trim(), created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);

    await saveMessage("user", userMsg.content, selectedAgentId);

    const apiMessages = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ messages: apiMessages, agentId: selectedAgentId }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Request failed" }));
        toast({ title: "Error", description: err.error || "Something went wrong", variant: "destructive" });
        setIsStreaming(false);
        return;
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantContent = "";

      const updateAssistant = (content: string) => {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content } : m));
          }
          return [...prev, { role: "assistant", content, created_at: new Date().toISOString() }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              updateAssistant(assistantContent);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      if (assistantContent) {
        await saveMessage("assistant", assistantContent, selectedAgentId);
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to get AI response", variant: "destructive" });
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  };

  const handleSelect = (id: string) => {
    setSelectedAgentId(id);
    navigate(`/demo?agentId=${id}`, { replace: true });
  };


  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Agent sidebar */}
      <div
        className={`border-r border-border bg-card transition-all duration-200 ${
          sidebarOpen ? "w-72" : "w-0 overflow-hidden"
        } hidden md:block`}
      >
        <div className="flex h-12 items-center justify-between border-b border-border px-4">
          <h3 className="text-sm font-semibold">Your Agents</h3>
        </div>
        <AgentSelector agents={agents} selectedId={selectedAgentId} onSelect={handleSelect} />
      </div>

      {/* Chat area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="flex h-12 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="hidden md:inline-flex" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
            </Button>
            {/* Mobile agent selector */}
            <select
              className="md:hidden rounded-md border border-input bg-background px-2 py-1 text-sm"
              value={selectedAgentId ?? ""}
              onChange={(e) => handleSelect(e.target.value)}
            >
              <option value="" disabled>Select agent</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            {selectedAgent && (
              <div className="hidden md:block">
                <p className="text-sm font-semibold">{selectedAgent.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{selectedAgent.business_type} • {selectedAgent.voice_type}</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Mode toggle */}
            {selectedAgentId && (
              <div className="flex rounded-lg border border-border bg-muted p-0.5">
                <Button
                  variant={mode === "chat" ? "default" : "ghost"}
                  size="sm"
                  className="gap-1.5 h-7 px-3 text-xs"
                  onClick={() => setMode("chat")}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Chat
                </Button>
                <Button
                  variant={mode === "voice" ? "default" : "ghost"}
                  size="sm"
                  className="gap-1.5 h-7 px-3 text-xs"
                  onClick={() => setMode("voice")}
                >
                  <Mic className="h-3.5 w-3.5" />
                  Voice
                </Button>
              </div>
            )}
            {selectedAgentId && messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearConversation} className="gap-1 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" /> Clear
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6">
          {!selectedAgentId ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Bot className="h-16 w-16 text-muted-foreground/40" />
              <h3 className="mt-4 font-display text-xl font-semibold">Select an Agent</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-md">
                Choose an agent from the sidebar to start a demo conversation and test how your AI phone agent behaves.
              </p>
            </div>
          ) : mode === "voice" && selectedAgent ? (
            <div className="flex h-full flex-col items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent mb-4">
                <Bot className="h-8 w-8 text-accent-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-1">{selectedAgent.name}</h3>
              <p className="text-xs text-muted-foreground mb-6">Voice conversation mode • Powered by ElevenLabs</p>
              <VoiceChat agent={selectedAgent} />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent">
                <Bot className="h-8 w-8 text-accent-foreground" />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold">{selectedAgent?.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-md">
                Start a conversation to simulate a phone call with this agent. Try asking for an appointment or general questions.
              </p>
            </div>
          ) : (
            <div className="mx-auto max-w-2xl space-y-4">
              {messages.map((msg, i) => (
                <ChatMessage
                  key={i}
                  role={msg.role}
                  content={msg.content}
                  timestamp={msg.created_at}
                  agentName={selectedAgent?.name}
                />
              ))}
              {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{selectedAgent?.name} is typing...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input - only in chat mode */}
        {selectedAgentId && mode === "chat" && (
          <div className="border-t border-border bg-card p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="mx-auto flex max-w-2xl gap-2"
            >
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message to test your agent..."
                disabled={isStreaming}
                className="flex-1"
              />
              <Button type="submit" disabled={isStreaming || !input.trim()} size="icon">
                {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
