import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CheckCircle, Clock, XCircle, DollarSign, Wallet, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface FinancialStats {
  totalDeferred: number;
  adminBalance: number;
  psychologistBalance: number;
}

interface PsychologistFinancials {
  psychologist_id: string;
  psychologist_name: string;
  deferred: number;
  balance: number;
  adminBalance: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [financialStats, setFinancialStats] = useState<FinancialStats>({
    totalDeferred: 0,
    adminBalance: 0,
    psychologistBalance: 0,
  });
  const [psychologistFinancials, setPsychologistFinancials] = useState<PsychologistFinancials[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'universal' | 'by-psychologist'>('universal');

  useEffect(() => {
    fetchStats();
    fetchFinancialStats();
    fetchPsychologistFinancials();

    // Real-time subscriptions
    const deferredChannel = supabase
      .channel('deferred-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deferred_revenue' }, () => {
        fetchFinancialStats();
        fetchPsychologistFinancials();
      })
      .subscribe();

    const walletChannel = supabase
      .channel('wallet-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_wallet' }, () => {
        fetchFinancialStats();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'psychologist_wallets' }, () => {
        fetchFinancialStats();
        fetchPsychologistFinancials();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(deferredChannel);
      supabase.removeChannel(walletChannel);
    };
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

  const fetchFinancialStats = async () => {
    try {
      // Get total deferred revenue
      const { data: deferredData, error: deferredError } = await supabase
        .from("deferred_revenue")
        .select("deferred_amount");

      if (deferredError) throw deferredError;

      const totalDeferred = deferredData?.reduce((sum, item) => sum + Number(item.deferred_amount), 0) || 0;

      // Get admin balance
      const { data: adminData, error: adminError } = await supabase
        .from("admin_wallet")
        .select("balance")
        .single();

      if (adminError) throw adminError;

      // Get total psychologist balance
      const { data: psychData, error: psychError } = await supabase
        .from("psychologist_wallets")
        .select("balance");

      if (psychError) throw psychError;

      const psychologistBalance = psychData?.reduce((sum, item) => sum + Number(item.balance), 0) || 0;

      setFinancialStats({
        totalDeferred,
        adminBalance: Number(adminData?.balance || 0),
        psychologistBalance,
      });
    } catch (error) {
      console.error("Error fetching financial stats:", error);
      toast.error("Error al cargar estadísticas financieras");
    }
  };

  const fetchPsychologistFinancials = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("psychologist_profiles")
        .select("id, first_name, last_name");

      if (profilesError) throw profilesError;

      const financials = await Promise.all(
        profiles.map(async (profile) => {
          // Get deferred revenue
          const { data: deferredData } = await supabase
            .from("deferred_revenue")
            .select("deferred_amount")
            .eq("psychologist_id", profile.id);

          const deferred = deferredData?.reduce((sum, item) => sum + Number(item.deferred_amount), 0) || 0;

          // Get wallet balance
          const { data: walletData } = await supabase
            .from("psychologist_wallets")
            .select("balance")
            .eq("psychologist_id", profile.id)
            .single();

          // Get admin balance from transactions for this psychologist
          const { data: adminTransactions } = await supabase
            .from("wallet_transactions")
            .select("amount")
            .eq("wallet_type", "admin")
            .eq("psychologist_id", profile.id);

          const adminBalance = adminTransactions?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;

          return {
            psychologist_id: profile.id,
            psychologist_name: `${profile.first_name} ${profile.last_name}`,
            deferred,
            balance: Number(walletData?.balance || 0),
            adminBalance,
          };
        })
      );

      setPsychologistFinancials(financials);
    } catch (error) {
      console.error("Error fetching psychologist financials:", error);
      toast.error("Error al cargar financieros por psicólogo");
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


      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Sistema Financiero</CardTitle>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'universal' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('universal')}
            >
              Universal
            </Button>
            <Button
              variant={viewMode === 'by-psychologist' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('by-psychologist')}
            >
              Por Psicólogo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'universal' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Ingreso Pasivo
                    </CardTitle>
                    <div className="p-2 rounded-lg bg-secondary/10">
                      <TrendingUp className="w-4 h-4 text-secondary" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    ${financialStats.totalDeferred.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Sesiones agendadas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Balance Admin
                    </CardTitle>
                    <div className="p-2 rounded-lg bg-primary/10">
                      <DollarSign className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    ${financialStats.adminBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">15% comisión</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Balance Psicólogos
                    </CardTitle>
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                      <Wallet className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    ${financialStats.psychologistBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">85% de ingresos</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-4">
              {psychologistFinancials.map((psych) => (
                <Card key={psych.psychologist_id}>
                  <CardHeader>
                    <CardTitle className="text-base">{psych.psychologist_name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="deferred" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="deferred">Ingreso Pasivo</TabsTrigger>
                        <TabsTrigger value="admin">Balance Admin</TabsTrigger>
                        <TabsTrigger value="psychologist">Balance Psicólogo</TabsTrigger>
                      </TabsList>
                      <TabsContent value="deferred" className="mt-4">
                        <div className="text-2xl font-bold text-foreground">
                          ${psych.deferred.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Sesiones agendadas pendientes</p>
                      </TabsContent>
                      <TabsContent value="admin" className="mt-4">
                        <div className="text-2xl font-bold text-foreground">
                          ${psych.adminBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">15% de comisión de sesiones completadas</p>
                      </TabsContent>
                      <TabsContent value="psychologist" className="mt-4">
                        <div className="text-2xl font-bold text-foreground">
                          ${psych.balance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">85% de sesiones completadas</p>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
