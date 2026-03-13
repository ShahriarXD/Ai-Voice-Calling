import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff, Loader2, Volume2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Agent = Tables<"agents">;

interface VoiceChatProps {
  agent: Agent;
}

export default function VoiceChat({ agent }: VoiceChatProps) {
  const { toast } = useToast();
  const [callActive, setCallActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [status, setStatus] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [userText, setUserText] = useState("");
  const [agentText, setAgentText] = useState("");
  const [callDuration, setCallDuration] = useState(0);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef(window.speechSynthesis);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoRestartRef = useRef(true);

  // Call duration timer
  useEffect(() => {
    if (callActive) {
      setCallDuration(0);
      timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callActive]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // Speak text using browser TTS, then resume listening
  const speak = useCallback((text: string) => {
    return new Promise<void>((resolve) => {
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1;

      // Try to pick a good voice
      const voices = synthRef.current.getVoices();
      const preferred = voices.find(
        (v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("natural")
      ) || voices.find(
        (v) => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Karen"))
      ) || voices.find((v) => v.lang.startsWith("en"));
      if (preferred) utterance.voice = preferred;

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      synthRef.current.speak(utterance);
    });
  }, []);

  // Send user text to AI and stream + speak response
  const processUserInput = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setStatus("thinking");
    setAgentText("");

    abortRef.current = new AbortController();

    try {
      const session = await supabase.auth.getSession();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.data.session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: text }],
          agentId: agent.id,
        }),
        signal: abortRef.current.signal,
      });

      if (!resp.ok) throw new Error("AI request failed");

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullResponse = "";
      let sentenceBuffer = "";

      // We'll speak sentence-by-sentence for real-time feel
      const speakSentence = async (sentence: string) => {
        if (!sentence.trim()) return;
        setStatus("speaking");
        await speak(sentence);
      };

      const sentenceEnders = /([.!?])\s/;

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
              fullResponse += delta;
              sentenceBuffer += delta;
              setAgentText(fullResponse);

              // Check if we have a complete sentence to speak
              const match = sentenceBuffer.match(sentenceEnders);
              if (match && match.index !== undefined) {
                const endIdx = match.index + match[0].length;
                const sentence = sentenceBuffer.slice(0, endIdx);
                sentenceBuffer = sentenceBuffer.slice(endIdx);
                await speakSentence(sentence);
              }
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // Speak any remaining text
      if (sentenceBuffer.trim()) {
        await speakSentence(sentenceBuffer.trim());
      }

      // Resume listening after speaking
      if (autoRestartRef.current) {
        startListening();
      }
    } catch (e: any) {
      if (e.name !== "AbortError") {
        console.error("Voice processing error:", e);
        toast({ title: "Error", description: "Failed to get response", variant: "destructive" });
        if (autoRestartRef.current) startListening();
      }
    }
  }, [agent.id, speak, toast]);

  // Start speech recognition
  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast({ title: "Not Supported", description: "Use Chrome for voice features", variant: "destructive" });
      return;
    }

    // Cancel any ongoing speech
    synthRef.current.cancel();

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => setStatus("listening");

    recognition.onresult = (event: any) => {
      const results = Array.from(event.results) as any[];
      const text = results.map((r) => r[0].transcript).join("");
      setUserText(text);

      if (event.results[event.results.length - 1].isFinal && text.trim()) {
        processUserInput(text.trim());
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === "no-speech" && autoRestartRef.current) {
        // Silently restart if no speech detected
        try { recognition.stop(); } catch {}
        setTimeout(() => {
          if (autoRestartRef.current) startListening();
        }, 100);
        return;
      }
      if (event.error !== "aborted") {
        console.error("Speech error:", event.error);
      }
    };

    recognition.onend = () => {
      // Don't auto-restart here — processUserInput handles it after speaking
    };

    recognitionRef.current = recognition;
    recognition.start();
    setUserText("");
  }, [processUserInput, toast]);

  // Start call
  const startCall = useCallback(async () => {
    setIsConnecting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      // Load voices
      synthRef.current.getVoices();
      autoRestartRef.current = true;
      setCallActive(true);
      setIsConnecting(false);

      // Speak greeting then start listening
      setStatus("speaking");
      const greeting = agent.greeting_message || `Hello! This is ${agent.name}. How can I help you today?`;
      setAgentText(greeting);
      await speak(greeting);
      startListening();
    } catch (e) {
      setIsConnecting(false);
      toast({ title: "Microphone Error", description: "Please allow microphone access", variant: "destructive" });
    }
  }, [agent, speak, startListening, toast]);

  // End call
  const endCall = useCallback(() => {
    autoRestartRef.current = false;
    setCallActive(false);
    setStatus("idle");
    synthRef.current.cancel();
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    if (abortRef.current) abortRef.current.abort();
    setUserText("");
    setAgentText("");
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      autoRestartRef.current = false;
      synthRef.current.cancel();
      if (recognitionRef.current) try { recognitionRef.current.stop(); } catch {}
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-5">
      {/* Status */}
      <div className="text-center space-y-1 min-h-[40px]">
        {callActive && (
          <p className="text-xs font-mono text-muted-foreground">{formatDuration(callDuration)}</p>
        )}
        <p className="text-sm font-medium text-foreground">
          {status === "listening"
            ? "Listening..."
            : status === "thinking"
            ? `${agent.name} is thinking...`
            : status === "speaking"
            ? `${agent.name} is speaking...`
            : callActive
            ? "Connected"
            : "Tap to start a call"}
        </p>
      </div>

      {/* Call button */}
      <div className="relative">
        {callActive && status === "listening" && (
          <div className="absolute -inset-4 rounded-full bg-green-500/15 animate-pulse" />
        )}
        {callActive && status === "speaking" && (
          <>
            <div className="absolute -inset-4 rounded-full bg-primary/15 animate-pulse" />
            <div className="absolute -inset-7 rounded-full bg-primary/5 animate-pulse" style={{ animationDelay: "0.2s" }} />
          </>
        )}
        {callActive && status === "thinking" && (
          <div className="absolute -inset-4 rounded-full bg-yellow-500/10 animate-pulse" />
        )}

        <Button
          size="icon"
          variant={callActive ? "destructive" : "default"}
          className={`relative z-10 h-24 w-24 rounded-full shadow-xl transition-all duration-300 ${
            callActive ? "" : "hover:scale-105"
          } ${status === "listening" ? "ring-4 ring-green-500/30" : ""}`}
          onClick={callActive ? endCall : startCall}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <Loader2 className="h-10 w-10 animate-spin" />
          ) : callActive ? (
            <PhoneOff className="h-10 w-10" />
          ) : (
            <Phone className="h-10 w-10" />
          )}
        </Button>
      </div>

      {/* Audio visualizer */}
      {callActive && (
        <div className="flex items-center gap-1.5 h-8">
          {status === "speaking" ? (
            <>
              <Volume2 className="h-4 w-4 text-primary" />
              <div className="flex items-end gap-0.5">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-primary rounded-full animate-pulse"
                    style={{
                      height: `${10 + Math.random() * 14}px`,
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: "0.5s",
                    }}
                  />
                ))}
              </div>
            </>
          ) : status === "listening" ? (
            <div className="flex items-end gap-0.5">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 rounded-full animate-pulse"
                  style={{
                    height: `${6 + Math.random() * 10}px`,
                    animationDelay: `${i * 0.12}s`,
                    animationDuration: "0.7s",
                    backgroundColor: "hsl(var(--green-500, 142 71% 45%))",
                  }}
                />
              ))}
            </div>
          ) : status === "thinking" ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : null}
        </div>
      )}

      {/* Live transcript */}
      {callActive && (userText || agentText) && (
        <div className="w-full max-w-sm space-y-2">
          {userText && (
            <div className="rounded-lg bg-muted px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">You</p>
              <p className="text-sm text-foreground">{userText}</p>
            </div>
          )}
          {agentText && (
            <div className="rounded-lg bg-accent px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{agent.name}</p>
              <p className="text-sm text-accent-foreground">{agentText}</p>
            </div>
          )}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">
        Free • Browser speech recognition & synthesis • Lovable AI
      </p>
    </div>
  );
}
