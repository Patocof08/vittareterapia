import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Wallet, TrendingUp, Clock, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface AdminWallet {
  balance: number;
  updated_at: string;
}

interface PsychWallet {
  balance: number;
  updated_at: string;
  psychologist_profiles: {
    first_name: string;
    last_name: string;
  } | null;
}

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  wallet_type: string;
  description: string | null;
  created_at: string;
  psychologist_profiles: {
    first_name: string;
    last_name: string;
  } | null;
}

interface DeferredSummary {
  total_deferred: number;
  total_recognized: number;
}

export default function AdminFinancials() {
  const [adminWallet, setAdminWallet] = useState<AdminWallet | null>(null);
  const [psychWallets, setPsychWallets] = useState<PsychWallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [deferred, setDeferred] = useState<DeferredSummary>({ total_deferred: 0, total_recognized: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [walletRes, psychRes, txRes, deferredRes] = await Promise.all([
        supabase.from("admin_wallet").select("balance, updated_at").maybeSingle(),
        supabase
          .from("psychologist_wallets")
          .select("balance, updated_at, psychologist_profiles(first_name, last_name)")
          .order("balance", { ascending: false }),
        supabase
          .from("wallet_transactions")
          .select("id, amount, transaction_type, wallet_type, description, created_at, psychologist_profiles(first_name, last_name)")
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("deferred_revenue")
          .select("deferred_amount, recognized_amount"),
      ]);

      if (walletRes.data) setAdminWallet(walletRes.data as AdminWallet);
      if (psychRes.data) setPsychWallets(psychRes.data as PsychWallet[]);
      if (txRes.data) setTransactions(txRes.data as Transaction[]);
      if (deferredRes.data) {
        const totalDeferred = deferredRes.data.reduce((sum, r) => sum + (r.deferred_amount || 0), 0);
        const totalRecognized = deferredRes.data.reduce((sum, r) => sum + (r.recognized_amount || 0), 0);
        setDeferred({ total_deferred: totalDeferred, total_recognized: totalRecognized });
      }
    } catch (error) {
      console.error("Error cargando financieros:", error);
      toast.error("Error al cargar el módulo financiero");
    } finally {
      setLoading(false);
    }
  };

  const totalPsychBalance = psychWallets.reduce((sum, w) => sum + (w.balance || 0), 0);

  const txTypeLabel: Record<string, { label: string; color: string }> = {
    session_completed: { label: "Sesión completada", color: "bg-green-100 text-green-700" },
    session_revenue:   { label: "Sesión reconocida", color: "bg-green-100 text-green-700" },
    admin_commission:  { label: "Comisión admin",    color: "bg-blue-100 text-blue-700"  },
    credit_expired:    { label: "Crédito expirado",  color: "bg-orange-100 text-orange-700" },
    account_deleted:   { label: "Cuenta eliminada",  color: "bg-red-100 text-red-700"   },
    refund:            { label: "Reembolso",          color: "bg-gray-100 text-gray-700" },
    late_cancellation: { label: "Canc. tardía",       color: "bg-yellow-100 text-yellow-700" },
  };

  // Para mostrar a quién fue la transacción (admin o psicólogo)
  const walletTypeLabel: Record<string, string> = {
    admin: "Admin",
    psychologist: "Psicólogo",
  };

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
        <h1 className="text-3xl font-bold text-foreground">Módulo Financiero</h1>
        <p className="text-muted-foreground mt-1">Balances, ingresos diferidos y transacciones</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Wallet Admin</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <Wallet className="w-4 h-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(adminWallet?.balance ?? 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">MXN</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Wallets Psicólogos</CardTitle>
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPsychBalance.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">{psychWallets.length} psicólogos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ingreso Diferido</CardTitle>
            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
              <Clock className="w-4 h-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${deferred.total_deferred.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Pendiente de reconocer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ingreso Reconocido</CardTitle>
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <ArrowUpRight className="w-4 h-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${deferred.total_recognized.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Acumulado histórico</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Psychologist wallets */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Wallets por Psicólogo</CardTitle>
          </CardHeader>
          <CardContent>
            {psychWallets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Sin wallets registradas</p>
            ) : (
              <div className="space-y-3">
                {psychWallets.map((w, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium text-sm">
                        {w.psychologist_profiles
                          ? `${w.psychologist_profiles.first_name} ${w.psychologist_profiles.last_name}`
                          : "Psicólogo desconocido"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Actualizado: {format(new Date(w.updated_at), "dd MMM yyyy", { locale: es })}
                      </p>
                    </div>
                    <span className="font-bold text-sm">${(w.balance || 0).toFixed(2)} MXN</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Últimas Transacciones</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Sin transacciones registradas</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => {
                  const typeInfo = txTypeLabel[tx.transaction_type] ?? {
                    label: tx.transaction_type,
                    color: "bg-gray-100 text-gray-700",
                  };
                  const isPositive = tx.amount >= 0;
                  return (
                    <div key={tx.id} className="flex items-start justify-between py-2 border-b border-border last:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={`text-xs ${typeInfo.color} border-0`}>{typeInfo.label}</Badge>
                          <Badge variant="outline" className="text-xs">
                            {walletTypeLabel[tx.wallet_type] ?? tx.wallet_type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {tx.psychologist_profiles
                            ? `${tx.psychologist_profiles.first_name} ${tx.psychologist_profiles.last_name}`
                            : "Admin"}
                          {tx.description ? ` · ${tx.description}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(tx.created_at), "dd MMM yyyy HH:mm", { locale: es })}
                        </p>
                      </div>
                      <span className={`font-bold text-sm ml-3 shrink-0 flex items-center gap-1 ${isPositive ? "text-green-600" : "text-red-600"}`}>
                        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        ${Math.abs(tx.amount).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
