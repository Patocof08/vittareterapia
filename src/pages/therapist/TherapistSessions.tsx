import { useState } from "react";
import { Video, Search, Filter, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// No data source yet
import { toast } from "sonner";

export default function TherapistSessions() {
  const [statusFilter, setStatusFilter] = useState<string>("todas");
  const [searchTerm, setSearchTerm] = useState("");

  const handleStartSession = (sessionId: string, videoLink?: string) => {
    if (videoLink) {
      toast.success("Abriendo videollamada...");
      // window.open(videoLink, "_blank");
    } else {
      toast.error("No hay enlace de videollamada disponible");
    }
  };

  const handleCompleteSession = (sessionId: string) => {
    toast.success("Sesión marcada como completada");
  };

  // Fuente de datos pendiente de implementar
  const filteredSessions: any[] = [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Sesiones</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona y revisa todas tus sesiones
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por paciente..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="confirmada">Confirmadas</SelectItem>
                <SelectItem value="pendiente">Pendientes</SelectItem>
                <SelectItem value="completada">Completadas</SelectItem>
                <SelectItem value="cancelada">Canceladas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de sesiones */}
      <div className="grid gap-4">
        {filteredSessions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Video className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No se encontraron sesiones con los filtros seleccionados
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredSessions.map((session) => (
            <Card key={session.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {session.patientName}
                    </CardTitle>
                    <p className="text-muted-foreground mt-1">
                      {new Date(session.date).toLocaleDateString("es-MX", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}{" "}
                      • {session.time} • {session.duration} min
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      session.status === "confirmada"
                        ? "bg-primary/10 text-primary"
                        : session.status === "pendiente"
                        ? "bg-secondary/10 text-secondary"
                        : session.status === "completada"
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {session.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {session.notes && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">
                        Notas de la sesión:
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {session.notes}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {session.videoLink && session.status === "confirmada" && (
                      <Button
                        onClick={() =>
                          handleStartSession(session.id, session.videoLink)
                        }
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Iniciar videollamada
                      </Button>
                    )}
                    {session.status === "confirmada" && (
                      <Button
                        variant="outline"
                        onClick={() => handleCompleteSession(session.id)}
                      >
                        Marcar como completada
                      </Button>
                    )}
                    <Button variant="ghost">Ver detalles del paciente</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
