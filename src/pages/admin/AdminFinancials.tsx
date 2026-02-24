import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  DollarSign, TrendingUp, Clock, CheckCircle, Download,
  AlertTriangle, Filter, FileSpreadsheet, Percent, Wallet,
} from "lucide-react";
import * as XLSX from "xlsx";

// ── Types ──────────────────────────────────────────────────────────
interface PlatformSummary {
  gross_income: number;
  admin_commission: number;
  psychologist_payments: number;
  pending_deferred: number;
  completed_sessions: number;
  account_deletion_income: number;
  platform_fee_total: number;
}

interface TransactionRow {
  transaction_date: string;
  event_type: string;
  session_type: string;
  client_name: string;
  psychologist_id: string | null;
  psychologist_name: string;
  gross_amount: number;
  admin_amount: number;
  psychologist_amount: number;
  admin_percentage: number;
  psychologist_percentage: number;
  appointment_id: string | null;
}

interface PsychSummaryRow {
  psychologist_id: string;
  psychologist_name: string;
  sessions_count: number;
  gross_income: number;
  admin_commission: number;
  psychologist_payment: number;
  pending_deferred: number;
  account_deletion_income: number;
}

interface PaymentDetail {
  id: string;
  created_at: string;
  base_amount: number | null;
  platform_fee: number | null;
  platform_fee_rate: number | null;
  amount: number;
  payment_type: string;
  payment_status: string;
}

// ── Helpers ────────────────────────────────────────────────────────
const fmx = (n: number) =>
  n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const SESSION_TYPE_LABELS: Record<string, string> = {
  single_session:   "Sesión Individual",
  "4_sessions":     "Paquete 4",
  package_4:        "Paquete 4",
  "8_sessions":     "Paquete 8",
  package_8:        "Paquete 8",
  account_deletion: "Eliminación de cuenta",
};

const PAYMENT_STATUS_BADGE: Record<string, string> = {
  completed: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800",
  pending:   "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800",
  failed:    "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800",
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  completed: "Completado",
  pending:   "Pendiente",
  failed:    "Fallido",
};

function getEventBadge(eventType: string) {
  if (eventType === "account_deletion")
    return { label: "Eliminación", cls: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800" };
  return { label: "Sesión completada", cls: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800" };
}

// ── Component ──────────────────────────────────────────────────────
export default function AdminFinancials() {
  const [summary, setSummary] = useState<PlatformSummary | null>(null);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [psychSummary, setPsychSummary] = useState<PsychSummaryRow[]>([]);
  const [paymentsDetail, setPaymentsDetail] = useState<PaymentDetail[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedPsychId, setSelectedPsychId] = useState("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (from = fromDate, to = toDate) => {
    setLoading(true);
    try {
      const fromDt = from ? `${from}T00:00:00.000Z` : null;
      const toDt   = to   ? `${to}T23:59:59.999Z`   : null;

      const [summaryRes, txRes, psychRes, paymentsRes] = await Promise.all([
        supabase.rpc("get_platform_financial_summary", { _from_date: fromDt, _to_date: toDt }),
        supabase.rpc("get_financial_report",            { _from_date: fromDt, _to_date: toDt }),
        supabase.rpc("get_financial_summary_by_psychologist", { _from_date: fromDt, _to_date: toDt }),
        // @ts-ignore - Types will regenerate automatically
        supabase
          .from("payments")
          .select("id, created_at, base_amount, platform_fee, platform_fee_rate, amount, payment_type, payment_status")
          .order("created_at", { ascending: false })
          .limit(200),
      ]);

      if (summaryRes.error) throw summaryRes.error;
      if (txRes.error)      throw txRes.error;
      if (psychRes.error)   throw psychRes.error;

      if (summaryRes.data?.[0]) setSummary(summaryRes.data[0] as PlatformSummary);
      setTransactions((txRes.data  ?? []) as TransactionRow[]);
      setPsychSummary((psychRes.data ?? []) as PsychSummaryRow[]);

      // Filter payments by date if provided
      let payments = (paymentsRes.data ?? []) as PaymentDetail[];
      if (fromDt) payments = payments.filter(p => p.created_at >= fromDt);
      if (toDt)   payments = payments.filter(p => p.created_at <= toDt);
      setPaymentsDetail(payments);
    } catch (err) {
      console.error("Error cargando reporte:", err);
      toast.error("Error al cargar el reporte financiero");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setSelectedPsychId("all");
    fetchData(fromDate, toDate);
  };

  const filteredTransactions =
    selectedPsychId === "all"
      ? transactions
      : transactions.filter((tx) => tx.psychologist_id === selectedPsychId);

  // Comisiones tab derived values
  const feeTotal = summary?.platform_fee_total ?? 0;
  const commissionTotal = summary?.admin_commission ?? 0;
  const totalAdminIncome = feeTotal + commissionTotal;
  const completedPaymentsCount = paymentsDetail.filter(p => p.payment_status === "completed").length;

  // ── Excel / CSV builders ───────────────────────────────────────
  const buildTxRows = (txs: TransactionRow[]) =>
    txs.map((tx) => ({
      Fecha: tx.transaction_date
        ? format(new Date(tx.transaction_date), "dd/MM/yyyy HH:mm", { locale: es })
        : "",
      Evento:          tx.event_type === "account_deletion" ? "Eliminación" : "Sesión completada",
      Tipo:            SESSION_TYPE_LABELS[tx.session_type] ?? tx.session_type,
      Cliente:         tx.client_name,
      "Psicólogo":     tx.psychologist_name,
      "Bruto (MXN)":   tx.gross_amount,
      "Admin (MXN)":   tx.admin_amount,
      "Admin (%)":     tx.admin_percentage / 100,
      "Psicólogo (MXN)": tx.psychologist_amount,
      "Psicólogo (%)": tx.psychologist_percentage / 100,
    }));

  const buildPaymentsRows = (payments: PaymentDetail[]) =>
    payments.map((p) => ({
      Fecha: p.created_at
        ? format(new Date(p.created_at), "dd/MM/yyyy HH:mm", { locale: es })
        : "",
      Tipo:                SESSION_TYPE_LABELS[p.payment_type] ?? p.payment_type,
      "Base (MXN)":        p.base_amount ?? p.amount,
      "Fee servicio (MXN)": p.platform_fee ?? 0,
      "Fee (%)":           p.platform_fee_rate ?? 0,
      "Total cliente (MXN)": p.amount,
      Estado:              PAYMENT_STATUS_LABEL[p.payment_status] ?? p.payment_status,
    }));

  const buildPsychRows = (rows: PsychSummaryRow[]) =>
    rows.map((r) => ({
      "Psicólogo":              r.psychologist_name,
      Sesiones:                 r.sessions_count,
      "Ingreso bruto (MXN)":    r.gross_income,
      "Comisión admin (MXN)":   r.admin_commission,
      "Pago psicólogo (MXN)":   r.psychologist_payment,
      "Diferido pendiente (MXN)": r.pending_deferred,
      "Eliminaciones (MXN)":    r.account_deletion_income,
    }));

  const buildSummaryRows = () =>
    summary
      ? [
          { Concepto: "Ingreso bruto total",       "Monto (MXN)": summary.gross_income },
          { Concepto: "Fee de servicio (5%)",       "Monto (MXN)": summary.platform_fee_total },
          { Concepto: "Comisión admin total (15%)", "Monto (MXN)": summary.admin_commission },
          { Concepto: "Total admin",                "Monto (MXN)": (summary.platform_fee_total ?? 0) + summary.admin_commission },
          { Concepto: "Pago a psicólogos total",    "Monto (MXN)": summary.psychologist_payments },
          { Concepto: "Diferido pendiente",         "Monto (MXN)": summary.pending_deferred },
          { Concepto: "Sesiones completadas",       "Cantidad":    summary.completed_sessions },
          { Concepto: "Ingreso por eliminaciones",  "Monto (MXN)": summary.account_deletion_income },
        ]
      : [];

  const autoFit = (ws: XLSX.WorkSheet, data: Record<string, unknown>[]) => {
    if (!data.length) return;
    ws["!cols"] = Object.keys(data[0]).map((key) => ({
      wch: Math.min(
        Math.max(key.length, ...data.map((r) => String(r[key] ?? "").length)) + 2,
        40
      ),
    }));
  };

  const applyFormats = (
    ws: XLSX.WorkSheet,
    data: Record<string, unknown>[],
    moneyKeys: string[],
    pctKeys: string[]
  ) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const moneyIdxs = moneyKeys.map((k) => headers.indexOf(k)).filter((i) => i >= 0);
    const pctIdxs   = pctKeys.map((k)   => headers.indexOf(k)).filter((i) => i >= 0);
    const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
    for (let R = range.s.r + 1; R <= range.e.r; R++) {
      moneyIdxs.forEach((C) => {
        const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
        if (cell) cell.z = '"$"#,##0.00';
      });
      pctIdxs.forEach((C) => {
        const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
        if (cell) cell.z = "0.0%";
      });
    }
  };

  const downloadExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      const txData      = buildTxRows(transactions);
      const psychData   = buildPsychRows(psychSummary);
      const summaryData = buildSummaryRows();
      const paymentsData = buildPaymentsRows(paymentsDetail);

      const wsTx = XLSX.utils.json_to_sheet(txData);
      autoFit(wsTx, txData);
      applyFormats(wsTx, txData,
        ["Bruto (MXN)", "Admin (MXN)", "Psicólogo (MXN)"],
        ["Admin (%)", "Psicólogo (%)"]
      );
      XLSX.utils.book_append_sheet(wb, wsTx, "Transacciones");

      const wsPayments = XLSX.utils.json_to_sheet(paymentsData);
      autoFit(wsPayments, paymentsData);
      applyFormats(wsPayments, paymentsData,
        ["Base (MXN)", "Fee servicio (MXN)", "Total cliente (MXN)"],
        ["Fee (%)"]
      );
      XLSX.utils.book_append_sheet(wb, wsPayments, "Pagos con Fee");

      const wsPsych = XLSX.utils.json_to_sheet(psychData);
      autoFit(wsPsych, psychData);
      applyFormats(wsPsych, psychData,
        ["Ingreso bruto (MXN)", "Comisión admin (MXN)", "Pago psicólogo (MXN)", "Diferido pendiente (MXN)", "Eliminaciones (MXN)"],
        []
      );
      XLSX.utils.book_append_sheet(wb, wsPsych, "Por Psicólogo");

      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      autoFit(wsSummary, summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen");

      XLSX.writeFile(wb, `vittare_reporte_financiero_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
      toast.success("Excel descargado correctamente");
    } catch (err) {
      console.error("Error generando Excel:", err);
      toast.error("Error al generar el Excel");
    }
  };

  const downloadCSV = () => {
    try {
      const ws  = XLSX.utils.json_to_sheet(buildTxRows(transactions));
      const csv = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `vittare_transacciones_${format(new Date(), "yyyy-MM-dd")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV descargado correctamente");
    } catch (err) {
      console.error("Error generando CSV:", err);
      toast.error("Error al generar el CSV");
    }
  };

  // ── Render ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Reportes Financieros</h1>
        <p className="text-muted-foreground mt-1">Ingresos, comisiones y pagos de la plataforma</p>
      </div>

      <Tabs defaultValue="reportes">
        <TabsList className="mb-4">
          <TabsTrigger value="reportes">Reportes</TabsTrigger>
          <TabsTrigger value="comisiones">Comisiones de Servicio</TabsTrigger>
        </TabsList>

        {/* ══════════════════ TAB 1: REPORTES ══════════════════ */}
        <TabsContent value="reportes" className="space-y-6">
          {/* ── SECTION A: Summary cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Ingreso Bruto Total</CardTitle>
                <div className="p-2 rounded-lg bg-primary/10">
                  <DollarSign className="w-4 h-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${fmx(summary?.gross_income ?? 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">MXN reconocido</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Comisión Admin Total</CardTitle>
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${fmx(summary?.admin_commission ?? 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">Wallet admin acumulado</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pago a Psicólogos</CardTitle>
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${fmx(summary?.psychologist_payments ?? 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">Wallets psicólogos acumulado</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Diferido Pendiente</CardTitle>
                <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                  <Clock className="w-4 h-4 text-yellow-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${fmx(summary?.pending_deferred ?? 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">Por reconocer</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Sesiones Completadas</CardTitle>
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                  <CheckCircle className="w-4 h-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary?.completed_sessions ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">En el período seleccionado</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Ingreso por Eliminaciones</CardTitle>
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${fmx(summary?.account_deletion_income ?? 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">Ingresado por cuentas eliminadas</p>
              </CardContent>
            </Card>
          </div>

          {/* ── SECTION B: Filters & export ── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filtros y Exportar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Desde</Label>
                  <Input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-40 h-9 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Hasta</Label>
                  <Input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-40 h-9 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Psicólogo</Label>
                  <Select value={selectedPsychId} onValueChange={setSelectedPsychId}>
                    <SelectTrigger className="w-52 h-9 text-sm">
                      <SelectValue placeholder="Todos los psicólogos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los psicólogos</SelectItem>
                      {psychSummary.map((p) => (
                        <SelectItem key={p.psychologist_id} value={p.psychologist_id}>
                          {p.psychologist_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleApplyFilters} className="h-9">
                  Aplicar filtros
                </Button>
                <Button
                  variant="outline"
                  className="h-9 bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800 dark:bg-green-950 dark:text-green-400 dark:border-green-800"
                  onClick={downloadExcel}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descargar Excel
                </Button>
                <Button variant="outline" className="h-9" onClick={downloadCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Descargar CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ── SECTION C: Transactions table ── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                Transacciones
                <span className="text-muted-foreground font-normal text-sm">
                  ({filteredTransactions.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {filteredTransactions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">
                  Sin transacciones en este período
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs whitespace-nowrap pl-4">Fecha</TableHead>
                        <TableHead className="text-xs whitespace-nowrap">Evento</TableHead>
                        <TableHead className="text-xs whitespace-nowrap">Tipo</TableHead>
                        <TableHead className="text-xs whitespace-nowrap">Cliente</TableHead>
                        <TableHead className="text-xs whitespace-nowrap">Psicólogo</TableHead>
                        <TableHead className="text-xs whitespace-nowrap text-right">Bruto</TableHead>
                        <TableHead className="text-xs whitespace-nowrap text-right">Admin (%)</TableHead>
                        <TableHead className="text-xs whitespace-nowrap text-right pr-4">Psicólogo (%)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((tx, i) => {
                        const badge = getEventBadge(tx.event_type);
                        return (
                          <TableRow key={`${tx.appointment_id ?? i}-${i}`}>
                            <TableCell className="text-xs whitespace-nowrap text-muted-foreground pl-4">
                              {tx.transaction_date
                                ? format(new Date(tx.transaction_date), "dd MMM yyyy HH:mm", { locale: es })
                                : "—"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-xs ${badge.cls}`}>
                                {badge.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs whitespace-nowrap">
                              {SESSION_TYPE_LABELS[tx.session_type] ?? tx.session_type}
                            </TableCell>
                            <TableCell className="text-xs max-w-[130px] truncate">
                              {tx.client_name}
                            </TableCell>
                            <TableCell className="text-xs max-w-[130px] truncate">
                              {tx.psychologist_name}
                            </TableCell>
                            <TableCell className="text-xs text-right font-semibold whitespace-nowrap">
                              ${fmx(tx.gross_amount)}
                            </TableCell>
                            <TableCell className="text-xs text-right whitespace-nowrap">
                              <span className="font-medium">${fmx(tx.admin_amount)}</span>
                              <span className="text-muted-foreground ml-1">({tx.admin_percentage}%)</span>
                            </TableCell>
                            <TableCell className="text-xs text-right whitespace-nowrap pr-4">
                              <span className="font-medium">${fmx(tx.psychologist_amount)}</span>
                              <span className="text-muted-foreground ml-1">({tx.psychologist_percentage}%)</span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── SECTION D: Per-psychologist summary ── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumen por Psicólogo</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {psychSummary.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">
                  Sin datos en este período
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs pl-4">Psicólogo</TableHead>
                        <TableHead className="text-xs text-right">Sesiones</TableHead>
                        <TableHead className="text-xs text-right">Ingreso bruto</TableHead>
                        <TableHead className="text-xs text-right">Comisión admin</TableHead>
                        <TableHead className="text-xs text-right">Pago psicólogo</TableHead>
                        <TableHead className="text-xs text-right">Diferido</TableHead>
                        <TableHead className="text-xs text-right pr-4">Eliminaciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {psychSummary.map((row) => (
                        <TableRow key={row.psychologist_id}>
                          <TableCell className="text-xs font-medium pl-4">{row.psychologist_name}</TableCell>
                          <TableCell className="text-xs text-right">{row.sessions_count}</TableCell>
                          <TableCell className="text-xs text-right font-semibold">${fmx(row.gross_income)}</TableCell>
                          <TableCell className="text-xs text-right">${fmx(row.admin_commission)}</TableCell>
                          <TableCell className="text-xs text-right">${fmx(row.psychologist_payment)}</TableCell>
                          <TableCell className="text-xs text-right text-yellow-600 dark:text-yellow-400">
                            ${fmx(row.pending_deferred)}
                          </TableCell>
                          <TableCell className="text-xs text-right text-red-600 dark:text-red-400 pr-4">
                            ${fmx(row.account_deletion_income)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════════════ TAB 2: COMISIONES DE SERVICIO ══════════════════ */}
        <TabsContent value="comisiones" className="space-y-6">
          {/* ── Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Fee de Servicio (5%)</CardTitle>
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <Percent className="w-4 h-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${fmx(feeTotal)}</div>
                <p className="text-xs text-muted-foreground mt-1">Cobrado al momento del pago</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Comisión Sesiones (15%)</CardTitle>
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${fmx(commissionTotal)}</div>
                <p className="text-xs text-muted-foreground mt-1">Al reconocer sesiones completadas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Admin</CardTitle>
                <div className="p-2 rounded-lg bg-primary/10">
                  <Wallet className="w-4 h-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${fmx(totalAdminIncome)}</div>
                <p className="text-xs text-muted-foreground mt-1">Fee + comisión acumulados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pagos Completados</CardTitle>
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                  <CheckCircle className="w-4 h-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedPaymentsCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Transacciones exitosas</p>
              </CardContent>
            </Card>
          </div>

          {/* ── Payments breakdown table ── */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                Desglose de Pagos
                <span className="text-muted-foreground font-normal text-sm">
                  ({paymentsDetail.length})
                </span>
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="h-8 bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-950 dark:text-green-400 dark:border-green-800"
                onClick={downloadExcel}
              >
                <Download className="w-3 h-3 mr-1.5" />
                Excel
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {paymentsDetail.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">
                  Sin pagos en este período
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs whitespace-nowrap pl-4">Fecha</TableHead>
                        <TableHead className="text-xs whitespace-nowrap">Tipo</TableHead>
                        <TableHead className="text-xs whitespace-nowrap text-right">Base</TableHead>
                        <TableHead className="text-xs whitespace-nowrap text-right">Fee (5%)</TableHead>
                        <TableHead className="text-xs whitespace-nowrap text-right">Total cliente</TableHead>
                        <TableHead className="text-xs whitespace-nowrap text-right pr-4">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentsDetail.map((p) => {
                        const base = p.base_amount ?? p.amount;
                        const fee  = p.platform_fee ?? 0;
                        return (
                          <TableRow key={p.id}>
                            <TableCell className="text-xs whitespace-nowrap text-muted-foreground pl-4">
                              {p.created_at
                                ? format(new Date(p.created_at), "dd MMM yyyy HH:mm", { locale: es })
                                : "—"}
                            </TableCell>
                            <TableCell className="text-xs whitespace-nowrap">
                              {SESSION_TYPE_LABELS[p.payment_type] ?? p.payment_type}
                            </TableCell>
                            <TableCell className="text-xs text-right font-medium whitespace-nowrap">
                              ${fmx(base)}
                            </TableCell>
                            <TableCell className="text-xs text-right whitespace-nowrap text-blue-600 dark:text-blue-400 font-medium">
                              {fee > 0 ? `$${fmx(fee)}` : "—"}
                            </TableCell>
                            <TableCell className="text-xs text-right font-semibold whitespace-nowrap">
                              ${fmx(p.amount)}
                            </TableCell>
                            <TableCell className="text-xs text-right whitespace-nowrap pr-4">
                              <Badge
                                variant="outline"
                                className={`text-xs ${PAYMENT_STATUS_BADGE[p.payment_status] ?? ""}`}
                              >
                                {PAYMENT_STATUS_LABEL[p.payment_status] ?? p.payment_status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
