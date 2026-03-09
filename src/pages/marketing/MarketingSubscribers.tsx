import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Download, Users } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

const MarketingSubscribers = () => {
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscribers();
  }, []);

  const loadSubscribers = async () => {
    try {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubscribers(data || []);
    } catch (error) {
      console.error("Error loading subscribers:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (subscribers.length === 0) {
      toast.error("No hay suscriptores para exportar");
      return;
    }

    const activeSubscribers = subscribers.filter((s) => s.subscribed);
    const csv = [
      "Email,Nombre,Fuente,Fecha de suscripción",
      ...activeSubscribers.map(
        (s) =>
          `${s.email},${s.name || ""},${s.source || ""},${format(new Date(s.created_at), "yyyy-MM-dd")}`
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vittare-suscriptores-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${activeSubscribers.length} suscriptores exportados`);
  };

  const activeCount = subscribers.filter((s) => s.subscribed).length;
  const unsubscribedCount = subscribers.filter((s) => !s.subscribed).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Suscriptores del Newsletter</h1>
          <p className="text-muted-foreground mt-1">Personas que quieren recibir contenido de Vittare</p>
        </div>
        <Button variant="outline" onClick={exportCSV}>
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <Users className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Dados de baja</CardTitle>
            <Mail className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-muted-foreground">{unsubscribedCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de suscriptores</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Cargando...</p>
          ) : subscribers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Aún no hay suscriptores</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-medium">Email</th>
                    <th className="text-left py-3 px-2 font-medium">Nombre</th>
                    <th className="text-left py-3 px-2 font-medium">Fuente</th>
                    <th className="text-left py-3 px-2 font-medium">Fecha</th>
                    <th className="text-left py-3 px-2 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((sub) => (
                    <tr key={sub.id} className="border-b border-border last:border-0">
                      <td className="py-3 px-2">{sub.email}</td>
                      <td className="py-3 px-2 text-muted-foreground">{sub.name || "—"}</td>
                      <td className="py-3 px-2 text-muted-foreground capitalize">{sub.source}</td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {format(new Date(sub.created_at), "d MMM yyyy", { locale: es })}
                      </td>
                      <td className="py-3 px-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          sub.subscribed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          {sub.subscribed ? "Activo" : "Baja"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketingSubscribers;
