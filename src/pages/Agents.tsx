import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Bot, Trash2, Edit2, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";

type Agent = Tables<"agents">;

const defaultForm = { name: "", business_type: "general", greeting_message: "Hello! How can I help you today?", voice_type: "professional" };

export default function Agents() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editId, setEditId] = useState<string | null>(null);

  const fetchAgents = async () => {
    if (!user) return;
    const { data } = await supabase.from("agents").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setAgents(data ?? []);
  };

  useEffect(() => { fetchAgents(); }, [user]);

  const handleSave = async () => {
    if (!user || !form.name) return;
    if (editId) {
      const { error } = await supabase.from("agents").update({ ...form, updated_at: new Date().toISOString() }).eq("id", editId);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Agent updated" });
    } else {
      const { error } = await supabase.from("agents").insert({ ...form, user_id: user.id });
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Agent created" });
    }
    setForm(defaultForm);
    setEditId(null);
    setOpen(false);
    fetchAgents();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("agents").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Agent deleted" });
    fetchAgents();
  };

  const openEdit = (agent: Agent) => {
    setForm({ name: agent.name, business_type: agent.business_type, greeting_message: agent.greeting_message, voice_type: agent.voice_type });
    setEditId(agent.id);
    setOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">AI Agents</h2>
          <p className="text-muted-foreground">Create and manage your voice agents.</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setForm(defaultForm); setEditId(null); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> New Agent</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editId ? "Edit Agent" : "Create Agent"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Agent Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="My Agent" />
              </div>
              <div className="space-y-2">
                <Label>Business Type</Label>
                <Select value={form.business_type} onValueChange={(v) => setForm({ ...form, business_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="real-estate">Real Estate</SelectItem>
                    <SelectItem value="restaurant">Restaurant</SelectItem>
                    <SelectItem value="legal">Legal</SelectItem>
                    <SelectItem value="salon">Salon / Spa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Greeting Message</Label>
                <Textarea value={form.greeting_message} onChange={(e) => setForm({ ...form, greeting_message: e.target.value })} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Voice Type</Label>
                <Select value={form.voice_type} onValueChange={(v) => setForm({ ...form, voice_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="authoritative">Authoritative</SelectItem>
                    <SelectItem value="warm">Warm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleSave}>{editId ? "Update Agent" : "Create Agent"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {agents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Bot className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-display text-lg font-semibold">No agents yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">Create your first AI voice agent to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Card key={agent.id}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="font-display">{agent.name}</CardTitle>
                  <p className="text-sm text-muted-foreground capitalize">{agent.business_type}</p>
                </div>
                <div className={`h-2.5 w-2.5 rounded-full ${agent.is_active ? "bg-success" : "bg-muted-foreground"}`} />
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">{agent.greeting_message}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded bg-secondary px-2 py-0.5 capitalize">{agent.voice_type}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" className="gap-1" onClick={() => navigate(`/demo?agentId=${agent.id}`)}>
                    <MessageSquare className="h-3.5 w-3.5" /> Test Agent
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => openEdit(agent)}>
                    <Edit2 className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1 text-destructive hover:text-destructive" onClick={() => handleDelete(agent.id)}>
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
