import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, CheckCircle, Clock, XCircle, Sparkles, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [pendingTranscripts, setPendingTranscripts] = useState<{ id: string; appointment_id: string }[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState<{ done: number; total: number } | null>(null);

  useEffect(() => {
    fetchStats();
    fetchPendingTranscripts();
  }, []);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from("psychologist_profiles")
        .select("verification_status");

      if (error) throw error;

      const newStats = {
        total: data.length,
        pending: data.filter((p) => p.verification_status === "pending").length,
        approved: data.filter((p) => p.verification_status === "approved").length,
        rejected: data.filter((p) => p.verification_status === "rejected").length,
      };

      setStats(newStats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Error al cargar estadísticas");
    } finally {
      setLoading(false);
    }
  };


  const fetchPendingTranscripts = async () => {
    const { data } = await (supabase as any)
      .from("session_transcripts")
      .select("id, appointment_id")
      .eq("status", "completed")
      .is("ai_summary", null);
    setPendingTranscripts(data || []);
  };

  const handleAnalyzeAll = async () => {
    if (pendingTranscripts.length === 0) return;
    setAnalyzing(true);
    setAnalyzeProgress({ done: 0, total: pendingTranscripts.length });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setAnalyzing(false); return; }

    let done = 0;
    for (const tx of pendingTranscripts) {
      try {
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-transcript`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ appointment_id: tx.appointment_id }),
        });
        if (!res.ok) console.error("Error analyzing", tx.appointment_id, res.status);
      } catch (e) {
        console.error("Error analyzing", tx.appointment_id, e);
      }
      done++;
      setAnalyzeProgress({ done, total: pendingTranscripts.length });
    }

    toast.success(`${done} transcripción(es) analizadas`);
    setAnalyzing(false);
    setAnalyzeProgress(null);
    await fetchPendingTranscripts();
  };

  const statCards = [
    {
      title: "Total Psicólogos",
      value: stats.total,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Pendientes",
      value: stats.pending,
      icon: Clock,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Aprobados",
      value: stats.approved,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: "Rechazados",
      value: stats.rejected,
      icon: XCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Vista general del sistema
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Transcript analysis section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-base">Transcripciones sin analizar</CardTitle>
          </div>
          <span className="text-2xl font-bold">{pendingTranscripts.length}</span>
        </CardHeader>
        <CardContent>
          {pendingTranscripts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todas las transcripciones han sido analizadas.</p>
          ) : (
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground flex-1">
                {pendingTranscripts.length} sesión(es) con transcripción completa sin análisis de IA.
              </p>
              <Button
                size="sm"
                onClick={handleAnalyzeAll}
                disabled={analyzing}
                className="gap-2 flex-shrink-0"
              >
                <Sparkles className={`w-4 h-4 ${analyzing ? "animate-pulse" : ""}`} />
                {analyzing && analyzeProgress
                  ? `Analizando ${analyzeProgress.done}/${analyzeProgress.total}...`
                  : "Analizar todas"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
