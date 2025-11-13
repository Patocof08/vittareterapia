import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CheckCircle, Clock, XCircle, Wallet, TrendingDown, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface PsychologistFinancials {
  psychologistId: string;
  psychologistName: string;
  deferredRevenue: number;
  adminBalance: number;
  psychologistBalance: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [psychologistFinancials, setPsychologistFinancials] = useState<PsychologistFinancials[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchPsychologistFinancials();

    // Realtime updates for financial stats
    const channel = supabase
      .channel('admin-financials')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deferred_revenue' }, () => {
        fetchPsychologistFinancials();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'psychologist_wallets' }, () => {
        fetchPsychologistFinancials();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallet_transactions' }, () => {
        fetchPsychologistFinancials();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStats = async () => {
    try {
      // @ts-ignore - Types will regenerate automatically
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

  const fetchPsychologistFinancials = async () => {
    try {
      // Get all psychologists
      const { data: psychologists } = await supabase
        .from("psychologist_profiles")
        .select("id, first_name, last_name");

      if (!psychologists) return;

      const financials = await Promise.all(
        psychologists.map(async (psych) => {
          // Get deferred revenue
          const { data: deferredData } = await supabase
            .from("deferred_revenue")
            .select("deferred_amount, subscription_id")
            .in("subscription_id", 
              (await supabase
                .from("client_subscriptions")
                .select("id")
                .eq("psychologist_id", psych.id))
              .data?.map(s => s.id) || []
            );

          const totalDeferred = deferredData?.reduce((sum, d) => sum + Number(d.deferred_amount), 0) || 0;

          // Get psychologist wallet balance
          const { data: walletData } = await supabase
            .from("psychologist_wallets")
            .select("balance")
            .eq("psychologist_id", psych.id)
            .single();

          const psychBalance = Number(walletData?.balance || 0);

          // Get admin balance from transactions for this psychologist
          const { data: adminTx } = await supabase
            .from("wallet_transactions")
            .select("amount")
            .eq("wallet_type", "admin")
            .in("subscription_id",
              (await supabase
                .from("client_subscriptions")
                .select("id")
                .eq("psychologist_id", psych.id))
              .data?.map(s => s.id) || []
            );

          const adminBalance = adminTx?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;

          return {
            psychologistId: psych.id,
            psychologistName: `${psych.first_name} ${psych.last_name}`,
            deferredRevenue: totalDeferred,
            adminBalance: adminBalance,
            psychologistBalance: psychBalance,
          };
        })
      );

      setPsychologistFinancials(financials);
    } catch (error) {
      console.error("Error fetching psychologist financials:", error);
    }
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

      {/* Financial Stats by Psychologist */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-4">Estado Financiero por Psicólogo</h2>
        <div className="space-y-4">
          {psychologistFinancials.map((psych) => (
            <Card key={psych.psychologistId}>
              <CardHeader>
                <CardTitle className="text-lg">{psych.psychologistName}</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="passive" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="passive">Ingreso Pasivo</TabsTrigger>
                    <TabsTrigger value="admin">Balance Admin</TabsTrigger>
                    <TabsTrigger value="psychologist">Balance Psicólogo</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="passive" className="mt-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                        <TrendingDown className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-foreground">
                          ${psych.deferredRevenue.toFixed(2)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Pendiente de reconocer (sesiones no completadas)
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="admin" className="mt-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Wallet className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-foreground">
                          ${psych.adminBalance.toFixed(2)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Comisiones generadas de este psicólogo
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="psychologist" className="mt-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-foreground">
                          ${psych.psychologistBalance.toFixed(2)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Balance acumulado del psicólogo
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No hay actividad reciente
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
