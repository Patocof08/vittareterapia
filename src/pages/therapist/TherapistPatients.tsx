import { useState } from "react";
import { Users, Search, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockPatients } from "@/data/therapistMockData";
import { Badge } from "@/components/ui/badge";

export default function TherapistPatients() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPatients = mockPatients.filter((patient) =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Pacientes</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona tu directorio de pacientes
        </p>
      </div>

      {/* Búsqueda */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar paciente por nombre..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de pacientes */}
      <div className="grid gap-4">
        {filteredPatients.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No se encontraron pacientes
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredPatients.map((patient) => (
            <Card key={patient.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{patient.name}</CardTitle>
                    <p className="text-muted-foreground mt-1">
                      {patient.email} • {patient.phone}
                    </p>
                  </div>
                  <Badge
                    variant={patient.status === "activo" ? "default" : "secondary"}
                  >
                    {patient.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Plan</p>
                      <p className="font-medium text-foreground">{patient.plan}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Sesiones</p>
                      <p className="font-medium text-foreground">
                        {patient.sessionCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Última sesión
                      </p>
                      <p className="font-medium text-foreground">
                        {patient.lastSession
                          ? new Date(patient.lastSession).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Estado</p>
                      <p className="font-medium text-foreground capitalize">
                        {patient.status}
                      </p>
                    </div>
                  </div>

                  {patient.tags.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Etiquetas
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {patient.tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      Ver ficha completa
                    </Button>
                    <Button size="sm" variant="outline">
                      Ver historial de sesiones
                    </Button>
                    <Button size="sm" variant="ghost">
                      Enviar mensaje
                    </Button>
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
