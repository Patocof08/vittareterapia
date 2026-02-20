import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfDay, startOfWeek, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { Wallet, TrendingUp, Clock, ArrowUpRight, ChevronDown, ChevronUp, Calendar } from "lucide-react";

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
  appointment_id: string | null;
  description: string | null;
  created_at: string;
  psychologist_profiles: {
    first_name: string;
    last_name: string;
  } | null;
}

interface GroupedSession {
  key: string;
  psychologist_name: string;
  session_type: string;
  created_at: string;
  admin_amount: number;
  psych_amount: number;
}

interface DeferredSummary {
  total_deferred: number;
  total_recognized: number;
}

type Period = "today" | "week" | "month" | "all";

const PERIOD_LABELS: Record<Period, string> = {
  today: "Hoy",
  week: "Esta semana",
  month: "Este mes",
  all: "Todas",
};

const SESSION_TYPE_LABEL: Record<string, string> = {
  single_session: "Sesión individual",
  "4_sessions": "Paquete 4 sesiones",
  "8_sessions": "Paquete 8 sesiones",
  package_4: "Paquete 4 sesiones",
  package_8: "Paquete 8 sesiones",
};

// Porcentajes sobre el precio de sesión del psicólogo (no sobre lo que pagó el cliente)
// El psicólogo siempre recibe 85%. El descuento del paquete reduce la comisión del admin.
function getPercentages(sessionType: string) {
  if (sessionType === "4_sessions" || sessionType === "package_4") return { admin: 5, psych: 85 };
  if (sessionType === "8_sessions" || sessionType === "package_8") return { admin: 0, psych: 85 };
  return { admin: 15, psych: 85 };
}

function extractSessionType(description: string | null): string {
  if (!description) return "single_session";
  const match = description.match(/\(([^)]+)\)/);
  return match ? match[1] : "single_session";
}

function filterByPeriod(txs: Transaction[], period: Period): Transaction[] {
  if (period === "all") return txs;
  const now = new Date();
  const cutoff =
    period === "today"
      ? startOfDay(now)
      : period === "week"
      ? startOfWeek(now, { weekStartsOn: 1 })
      : startOfMonth(now);
  return txs.filter((tx) => new Date(tx.created_at) >= cutoff);
}

function groupTransactions(txs: Transaction[]): GroupedSession[] {
  const map = new Map<string, { admin: Transaction | null; psych: Transaction | null }>();

  for (const tx of txs) {
    if (tx.transaction_type !== "session_completed") continue;
    const key = tx.appointment_id ?? tx.id;
    if (!map.has(key)) map.set(key, { admin: null, psych: null });
    if (tx.wallet_type === "admin") map.get(key)!.admin = tx;
    else map.get(key)!.psych = tx;
  }

  return Array.from(map.entries())
    .map(([key, { admin, psych }]) => {
      const ref = psych ?? admin!;
      const session_type = extractSessionType(ref.description);
      const name = ref.psychologist_profiles
        ? `${ref.psychologist_profiles.first_name} ${ref.psychologist_profiles.last_name}`
        : "Desconocido";
      return {
        key,
        psychologist_name: name,
        session_type,
        created_at: ref.created_at,
        admin_amount: admin ? Number(admin.amount) : 0,
        psych_amount: psych ? Number(psych.amount) : 0,
      };
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);
}

export default function AdminFinancials() {
  const [adminWallet, setAdminWallet] = useState<AdminWallet | null>(null);
  const [psychWallets, setPsychWallets] = useState<PsychWallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [deferred, setDeferred] = useState<DeferredSummary>({ total_deferred: 0, total_recognized: 0 });
  const [loading, setLoading] = useState(true);
  const [transactionPeriod, setTransactionPeriod] = useState<Period>("month");
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
          .select("id, amount, transaction_type, wallet_type, appointment_id, description, created_at, psychologist_profiles(first_name, last_name)")
          .order("created_at", { ascending: false })
          .limit(100),
        supabase.from("deferred_revenue").select("deferred_amount, recognized_amount"),
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

  const filteredTxs = filterByPeriod(transactions, transactionPeriod);
  const groupedSessions = groupTransactions(filteredTxs);

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
            <div className="text-2xl font-bold">${(adminWallet?.balance ?? 0).toFixed(2)}</div>
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

        {/* Grouped transactions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Últimas Transacciones
              </CardTitle>
            </div>
            {/* Period filter */}
            <div className="mt-2">
              <Select
                value={transactionPeriod}
                onValueChange={(val) => {
                  setTransactionPeriod(val as Period);
                  setExpandedId(null);
                }}
              >
                <SelectTrigger className="w-40 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
                    <SelectItem key={p} value={p} className="text-xs">
                      {PERIOD_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {groupedSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Sin sesiones en este período
              </p>
            ) : (
              <div className="space-y-1">
                {groupedSessions.map((session) => {
                  const isExpanded = expandedId === session.key;
                  const pcts = getPercentages(session.session_type);
                  const total = session.admin_amount + session.psych_amount;
                  return (
                    <div key={session.key} className="border border-border rounded-lg overflow-hidden">
                      {/* Collapsed row */}
                      <button
                        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-accent/50 transition-colors text-left"
                        onClick={() => setExpandedId(isExpanded ? null : session.key)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className="text-xs bg-green-100 text-green-700 border-0">
                              Sesión completada
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {SESSION_TYPE_LABEL[session.session_type] ?? session.session_type}
                            </span>
                          </div>
                          <p className="text-sm font-medium mt-0.5 truncate">{session.psychologist_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(session.created_at), "dd MMM yyyy HH:mm", { locale: es })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-3 shrink-0">
                          <span className="font-bold text-sm">${total.toFixed(2)}</span>
                          {isExpanded
                            ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                            : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </div>
                      </button>

                      {/* Expanded breakdown */}
                      {isExpanded && (
                        <div className="bg-muted/50 px-3 py-2 border-t border-border space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">
                              Comisión Admin ({pcts.admin}%):
                            </span>
                            <span className="font-medium">${session.admin_amount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">
                              Pago Psicólogo ({pcts.psych}%):
                            </span>
                            <span className="font-medium">${session.psych_amount.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
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
