import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Phone, Clock, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [agentCount, setAgentCount] = useState(0);
  const [callCount, setCallCount] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const [agents, calls] = await Promise.all([
        supabase.from("agents").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("calls").select("duration").eq("user_id", user.id),
      ]);
      setAgentCount(agents.count ?? 0);
      setCallCount(calls.data?.length ?? 0);
      setTotalMinutes(Math.round((calls.data?.reduce((sum, c) => sum + (c.duration || 0), 0) ?? 0) / 60));
    };
    fetchStats();
  }, [user]);

  const stats = [
    { label: "Active Agents", value: agentCount, icon: Bot, color: "text-primary" },
    { label: "Total Calls", value: callCount, icon: Phone, color: "text-success" },
    { label: "Minutes Used", value: totalMinutes, icon: Clock, color: "text-warning" },
    { label: "Success Rate", value: "—", icon: TrendingUp, color: "text-accent-foreground" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold">Welcome back</h2>
        <p className="text-muted-foreground">Here's an overview of your voice agents.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-display">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No recent activity. Create your first agent to get started!</p>
        </CardContent>
      </Card>
    </div>
  );
}
