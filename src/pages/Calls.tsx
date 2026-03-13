import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Phone } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Call = Tables<"calls">;

export default function Calls() {
  const { user } = useAuth();
  const [calls, setCalls] = useState<Call[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("calls").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => {
      setCalls(data ?? []);
    });
  }, [user]);

  const statusColor = (s: string) => {
    switch (s) {
      case "completed": return "bg-success/10 text-success border-success/20";
      case "missed": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-warning/10 text-warning border-warning/20";
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold">Call Logs</h2>
        <p className="text-muted-foreground">Review your call history and transcripts.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {calls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Phone className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 font-display text-lg font-semibold">No calls yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">Calls will appear here once your agents start receiving them.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Caller</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calls.map((call) => (
                  <TableRow key={call.id}>
                    <TableCell className="font-medium">{call.caller_number}</TableCell>
                    <TableCell>{Math.round(call.duration / 60)}m {call.duration % 60}s</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColor(call.status)}>{call.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{new Date(call.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
