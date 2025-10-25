import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, CheckCircle, Clock, XCircle, DollarSign, TrendingDown, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface FinancialStats {
  adminBalance: number;
  deferredRevenue: number;
  recognizedRevenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [financialStats, setFinancialStats] = useState<FinancialStats>({
    adminBalance: 0,
    deferredRevenue: 0,
    recognizedRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchFinancialStats();
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

  const fetchFinancialStats = async () => {
    try {
      // Get admin wallet balance
      const { data: adminWallet } = await supabase
        .from("admin_wallet")
        .select("balance")
        .single();

      // Get total deferred revenue
      const { data: deferredData } = await supabase
        .from("deferred_revenue")
        .select("deferred_amount, recognized_amount");

      const totalDeferred = deferredData?.reduce((sum, d) => sum + Number(d.deferred_amount), 0) || 0;
      const totalRecognized = deferredData?.reduce((sum, d) => sum + Number(d.recognized_amount), 0) || 0;

      setFinancialStats({
        adminBalance: Number(adminWallet?.balance || 0),
        deferredRevenue: totalDeferred,
        recognizedRevenue: totalRecognized,
      });
    } catch (error) {
      console.error("Error fetching financial stats:", error);
    }
  };

  const processHistoricalPayments = async () => {
    try {
      toast.info("Procesando pagos históricos...");
      
      // Find package payments that need processing (completed but no deferred_revenue)
      const { data: packagePayments } = await supabase
        .from("payments")
        .select(`
          id,
          amount,
          psychologist_id,
          subscription_id
        `)
        .in("payment_type", ["package_4", "package_8"])
        .eq("payment_status", "completed")
        .not("subscription_id", "is", null);

      const found = packagePayments?.length || 0;

      if (!packagePayments || packagePayments.length === 0) {
        toast.info("No hay pagos históricos por procesar");
        return;
      }

      let processed = 0;
      for (const payment of packagePayments) {
        // Check if already processed
        const { data: existingDeferred } = await supabase
          .from("deferred_revenue")
          .select("id")
          .eq("subscription_id", payment.subscription_id)
          .maybeSingle();

        if (existingDeferred) continue; // Already processed

        // Fetch subscription to get sessions_total
        const { data: sub } = await supabase
          .from("client_subscriptions")
          .select("sessions_total")
          .eq("id", payment.subscription_id)
          .maybeSingle();

        if (!sub) continue;

        // Process this payment
        const { error: rpcError } = await supabase.rpc('process_package_purchase', {
          _subscription_id: payment.subscription_id,
          _payment_id: payment.id,
          _psychologist_id: payment.psychologist_id,
          _total_amount: payment.amount,
          _sessions_total: sub.sessions_total,
        });

        if (!rpcError) {
          processed++;
        } else {
          console.error("Error processing payment:", payment.id, rpcError);
        }
      }

      if (processed > 0) {
        toast.success(`${processed}/${found} pago(s) procesado(s)`);
        fetchFinancialStats();
        fetchStats();
      } else {
        toast.info(`0/${found} pagos procesados (posiblemente ya estaban procesados)`);
      }
    } catch (error) {
      console.error("Error processing historical payments:", error);
      toast.error("Error al procesar pagos históricos");
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

      {/* Financial Stats */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-4">Estado Financiero</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Balance Admin
              </CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="w-4 h-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                ${financialStats.adminBalance.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Disponible en plataforma
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ingreso Diferido (Pasivo)
              </CardTitle>
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                <TrendingDown className="w-4 h-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                ${financialStats.deferredRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Pendiente de reconocer
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ingreso Reconocido
              </CardTitle>
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                ${financialStats.recognizedRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Ya reconocido como ingreso
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Process Historical Payments Button */}
        <div className="mt-4">
          <Button 
            variant="outline" 
            onClick={processHistoricalPayments}
            className="w-full md:w-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Procesar Pagos Históricos
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Ejecuta esta acción si hay pagos de paquetes que no se reflejan en el balance
          </p>
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
