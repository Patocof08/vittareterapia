import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Shield,
  ShieldAlert,
  MessageSquare,
  Video,
  Eye,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  User,
  Clock,
  Filter,
  Bell,
  BellOff,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface AdminAlert {
  id: string;
  alert_type: string;
  severity: string;
  appointment_id: string | null;
  psychologist_id: string | null;
  patient_id: string | null;
  details: Record<string, any>;
  transcript_excerpt: string | null;
  is_read: boolean;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
  // joined
  psychologist_name?: string;
  patient_name?: string;
}

type FilterType = "all" | "unread" | "unresolved" | "critical" | "warning";

export default function AdminAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("unresolved");
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});
  const [resolving, setResolving] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    critical: 0,
    unresolved: 0,
  });

  useEffect(() => {
    fetchAlerts();
    fetchStats();

    // Realtime subscription for new alerts
    const channel = supabase
      .channel("admin-alerts-channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "admin_alerts" },
        (_payload) => {
          toast.warning("Nueva alerta de seguridad", {
            description: "Se detectó un intento de compartir información de contacto.",
          });
          fetchAlerts();
          fetchStats();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "admin_alerts" },
        () => {
          fetchAlerts();
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter]);

  const fetchStats = async () => {
    try {
      const { data: all, error } = await supabase
        .from("admin_alerts")
        .select("id, is_read, is_resolved, severity");

      if (error) throw error;

      setStats({
        total: all?.length || 0,
        unread: all?.filter((a) => !a.is_read).length || 0,
        critical: all?.filter((a) => a.severity === "critical" && !a.is_resolved).length || 0,
        unresolved: all?.filter((a) => !a.is_resolved).length || 0,
      });
    } catch (error) {
      console.error("Error fetching alert stats:", error);
    }
  };

  const fetchAlerts = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from("admin_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (filter === "unread") query = query.eq("is_read", false);
      if (filter === "unresolved") query = query.eq("is_resolved", false);
      if (filter === "critical") query = query.eq("severity", "critical").eq("is_resolved", false);
      if (filter === "warning") query = query.eq("severity", "warning").eq("is_resolved", false);

      const { data, error } = await query;
      if (error) throw error;

      // Enrich with names
      const enriched = await Promise.all(
        (data || []).map(async (alert) => {
          let psychologist_name = "—";
          let patient_name = "—";

          if (alert.psychologist_id) {
            const { data: psych } = await supabase
              .from("psychologist_profiles")
              .select("first_name, last_name")
              .eq("id", alert.psychologist_id)
              .maybeSingle();
            if (psych) psychologist_name = `${psych.first_name} ${psych.last_name}`;
          }

          if (alert.patient_id) {
            const { data: patient } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", alert.patient_id)
              .maybeSingle();
            if (patient) patient_name = patient.full_name || "—";
          }

          return { ...alert, psychologist_name, patient_name };
        })
      );

      setAlerts(enriched);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      toast.error("Error al cargar alertas");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from("admin_alerts")
        .update({ is_read: true })
        .eq("id", alertId);

      if (error) throw error;

      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, is_read: true } : a))
      );
      fetchStats();
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const resolveAlert = async (alertId: string) => {
    if (!user) return;

    setResolving(alertId);
    try {
      const { error } = await supabase
        .from("admin_alerts")
        .update({
          is_resolved: true,
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
          resolution_notes: resolutionNotes[alertId] || null,
          is_read: true,
        })
        .eq("id", alertId);

      if (error) throw error;

      toast.success("Alerta resuelta");
      setExpandedAlert(null);
      setResolutionNotes((prev) => {
        const next = { ...prev };
        delete next[alertId];
        return next;
      });
      fetchAlerts();
      fetchStats();
    } catch (error) {
      console.error("Error resolving alert:", error);
      toast.error("Error al resolver alerta");
    } finally {
      setResolving(null);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from("admin_alerts")
        .update({ is_read: true })
        .eq("is_read", false);

      if (error) throw error;
      toast.success("Todas las alertas marcadas como leídas");
      fetchAlerts();
      fetchStats();
    } catch (error) {
      toast.error("Error al actualizar alertas");
    }
  };

  const getAlertTypeInfo = (alert: AdminAlert) => {
    if (alert.alert_type === "contact_info_videocall") {
      return {
        icon: <Video className="w-4 h-4" />,
        label: "Videollamada",
        color: "text-purple-600",
        bg: "bg-purple-50 dark:bg-purple-950/30",
      };
    }
    return {
      icon: <MessageSquare className="w-4 h-4" />,
      label: "Mensaje",
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950/30",
    };
  };

  const getViolationLabel = (type: string | undefined) => {
    const labels: Record<string, string> = {
      phone_number: "Número de teléfono",
      phone_number_formatted: "Teléfono con formato",
      phone_number_words: "Teléfono en palabras",
      phone_split_messages: "Teléfono dividido en mensajes",
      phone_words_split_messages: "Teléfono en palabras (dividido)",
      email: "Correo electrónico",
      email_disguised: "Correo disfrazado",
      email_split_messages: "Correo dividido en mensajes",
      social_media: "Red social / mensajería",
      url: "Enlace / URL",
    };
    return labels[type || ""] || type || "Contacto externo";
  };

  const getSenderLabel = (alert: AdminAlert) => {
    const senderId = alert.details?.sender_id || alert.details?.who_initiated;
    if (!senderId) return null;

    if (senderId === "psychologist" || senderId === alert.psychologist_id) {
      return { label: "Psicólogo", variant: "destructive" as const };
    }
    if (senderId === "patient" || senderId === alert.patient_id) {
      return { label: "Paciente", variant: "secondary" as const };
    }
    if (senderId === "both") {
      return { label: "Ambos", variant: "destructive" as const };
    }
    return null;
  };

  if (loading && alerts.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Alertas de seguridad</h1>
          <p className="text-muted-foreground mt-1">
            Intentos de compartir información de contacto
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAlerts} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          {stats.unread > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <BellOff className="w-4 h-4 mr-2" />
              Marcar todo leído
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          className={`cursor-pointer transition-colors ${filter === "all" ? "ring-2 ring-primary" : ""}`}
          onClick={() => setFilter("all")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Shield className="w-8 h-8 text-muted-foreground/40" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-colors ${filter === "unread" ? "ring-2 ring-primary" : ""}`}
          onClick={() => setFilter("unread")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sin leer</p>
                <p className="text-2xl font-bold">{stats.unread}</p>
              </div>
              <Bell className={`w-8 h-8 ${stats.unread > 0 ? "text-blue-500" : "text-muted-foreground/40"}`} />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-colors ${filter === "critical" ? "ring-2 ring-primary" : ""}`}
          onClick={() => setFilter("critical")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Críticas</p>
                <p className="text-2xl font-bold">{stats.critical}</p>
              </div>
              <ShieldAlert className={`w-8 h-8 ${stats.critical > 0 ? "text-destructive" : "text-muted-foreground/40"}`} />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-colors ${filter === "unresolved" ? "ring-2 ring-primary" : ""}`}
          onClick={() => setFilter("unresolved")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold">{stats.unresolved}</p>
              </div>
              <Clock className={`w-8 h-8 ${stats.unresolved > 0 ? "text-amber-500" : "text-muted-foreground/40"}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            {filter === "all" && "Todas las alertas"}
            {filter === "unread" && "Alertas sin leer"}
            {filter === "unresolved" && "Alertas pendientes"}
            {filter === "critical" && "Alertas críticas"}
            {filter === "warning" && "Alertas de advertencia"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Shield className="w-12 h-12 mb-4 opacity-30" />
              <p className="font-medium">Sin alertas</p>
              <p className="text-sm mt-1">
                No hay alertas que coincidan con este filtro.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => {
                const typeInfo = getAlertTypeInfo(alert);
                const sender = getSenderLabel(alert);
                const isExpanded = expandedAlert === alert.id;

                return (
                  <div
                    key={alert.id}
                    className={`border rounded-lg transition-all ${
                      !alert.is_read
                        ? "border-primary/40 bg-primary/5"
                        : alert.is_resolved
                        ? "border-border bg-muted/30 opacity-70"
                        : "border-border"
                    }`}
                  >
                    {/* Alert Row */}
                    <button
                      className="w-full p-4 text-left"
                      onClick={() => {
                        setExpandedAlert(isExpanded ? null : alert.id);
                        if (!alert.is_read) markAsRead(alert.id);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        {/* Severity icon */}
                        <div
                          className={`mt-0.5 p-1.5 rounded-lg flex-shrink-0 ${
                            alert.severity === "critical"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-amber-100 text-amber-600 dark:bg-amber-950/30"
                          }`}
                        >
                          {alert.severity === "critical" ? (
                            <ShieldAlert className="w-4 h-4" />
                          ) : (
                            <AlertTriangle className="w-4 h-4" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            {/* Severity badge */}
                            <Badge
                              variant={alert.severity === "critical" ? "destructive" : "secondary"}
                              className="text-xs"
                            >
                              {alert.severity === "critical" ? "Crítica" : "Advertencia"}
                            </Badge>

                            {/* Channel badge */}
                            <Badge variant="outline" className={`text-xs ${typeInfo.color}`}>
                              {typeInfo.icon}
                              <span className="ml-1">{typeInfo.label}</span>
                            </Badge>

                            {/* Violation type */}
                            <span className="text-xs text-muted-foreground">
                              {getViolationLabel(alert.details?.violation_type)}
                            </span>

                            {/* Unread dot */}
                            {!alert.is_read && (
                              <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                            )}

                            {/* Resolved */}
                            {alert.is_resolved && (
                              <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Resuelta
                              </Badge>
                            )}
                          </div>

                          {/* Names */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                            <span className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="font-medium">{alert.psychologist_name}</span>
                              <span className="text-muted-foreground">→</span>
                              <span>{alert.patient_name}</span>
                            </span>

                            {sender && (
                              <Badge variant={sender.variant} className="text-xs">
                                Iniciado por: {sender.label}
                              </Badge>
                            )}
                          </div>

                          {/* Excerpt preview */}
                          {alert.transcript_excerpt && !isExpanded && (
                            <p className="text-sm text-muted-foreground mt-1.5 truncate max-w-lg">
                              "{alert.transcript_excerpt}"
                            </p>
                          )}

                          {/* Time */}
                          <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(alert.created_at), {
                              addSuffix: true,
                              locale: es,
                            })}
                            {" · "}
                            {format(new Date(alert.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
                          </p>
                        </div>

                        {/* Expand/collapse */}
                        <div className="flex-shrink-0 text-muted-foreground">
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Expanded Detail */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t pt-4 space-y-4">
                        {/* Transcript excerpt */}
                        {alert.transcript_excerpt && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                              Fragmento detectado
                            </p>
                            <div className="bg-muted/50 border rounded-md p-3">
                              <p className="text-sm italic">"{alert.transcript_excerpt}"</p>
                            </div>
                          </div>
                        )}

                        {/* Details from AI */}
                        {alert.details?.what_was_shared && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                              Qué se compartió
                            </p>
                            <p className="text-sm">{alert.details.what_was_shared}</p>
                          </div>
                        )}

                        {alert.details?.context && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                              Contexto
                            </p>
                            <p className="text-sm">{alert.details.context}</p>
                          </div>
                        )}

                        {/* Details grid */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {alert.details?.violation_type && (
                            <div>
                              <p className="text-xs text-muted-foreground">Tipo de violación</p>
                              <p className="font-medium">
                                {getViolationLabel(alert.details.violation_type)}
                              </p>
                            </div>
                          )}
                          {alert.details?.who_initiated && alert.details.who_initiated !== "none" && (
                            <div>
                              <p className="text-xs text-muted-foreground">Iniciado por</p>
                              <p className="font-medium capitalize">{alert.details.who_initiated}</p>
                            </div>
                          )}
                          {alert.details?.message_blocked !== undefined && (
                            <div>
                              <p className="text-xs text-muted-foreground">Mensaje bloqueado</p>
                              <p className="font-medium">
                                {alert.details.message_blocked ? "Sí — bloqueado" : "No — se envió"}
                              </p>
                            </div>
                          )}
                          {alert.appointment_id && (
                            <div>
                              <p className="text-xs text-muted-foreground">Sesión</p>
                              <p className="font-medium text-xs font-mono">{alert.appointment_id.slice(0, 8)}...</p>
                            </div>
                          )}
                        </div>

                        {/* Resolution */}
                        {alert.is_resolved ? (
                          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 rounded-md p-3">
                            <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-1">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="font-medium text-sm">Resuelta</span>
                              {alert.resolved_at && (
                                <span className="text-xs text-green-600/70">
                                  {format(new Date(alert.resolved_at), "dd MMM yyyy, HH:mm", {
                                    locale: es,
                                  })}
                                </span>
                              )}
                            </div>
                            {alert.resolution_notes && (
                              <p className="text-sm text-green-700 dark:text-green-300">
                                {alert.resolution_notes}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3 pt-2">
                            <Textarea
                              placeholder="Notas de resolución (opcional): qué acción se tomó, si se contactó al psicólogo, etc."
                              value={resolutionNotes[alert.id] || ""}
                              onChange={(e) =>
                                setResolutionNotes((prev) => ({
                                  ...prev,
                                  [alert.id]: e.target.value,
                                }))
                              }
                              rows={2}
                              className="text-sm"
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setExpandedAlert(null)}
                              >
                                Cerrar
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => resolveAlert(alert.id)}
                                disabled={resolving === alert.id}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                {resolving === alert.id ? "Resolviendo..." : "Marcar como resuelta"}
                              </Button>
                            </div>
                          </div>
                        )}
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
  );
}
