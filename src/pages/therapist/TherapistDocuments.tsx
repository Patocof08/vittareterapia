import { FileText, Upload, CheckCircle, Clock, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockDocuments } from "@/data/therapistMockData";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function TherapistDocuments() {
  const handleUpload = (docType: string) => {
    toast.success(`Funcionalidad de carga de ${docType} en desarrollo`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "aprobado":
        return <CheckCircle className="w-5 h-5 text-primary" />;
      case "pendiente":
        return <Clock className="w-5 h-5 text-secondary" />;
      case "rechazado":
        return <XCircle className="w-5 h-5 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "aprobado":
        return <Badge variant="default">Aprobado</Badge>;
      case "pendiente":
        return <Badge variant="secondary">Pendiente</Badge>;
      case "rechazado":
        return <Badge variant="destructive">Rechazado</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Documentos</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona tu verificación y documentación
        </p>
      </div>

      {/* Información de verificación */}
      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">
                Verificación de identidad (KYC)
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Para poder recibir pagos y aparecer en el directorio público, es
                necesario completar la verificación de tu identidad y documentos
                profesionales.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documentos requeridos */}
      <Card>
        <CardHeader>
          <CardTitle>Documentos profesionales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  {getStatusIcon(doc.status)}
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{doc.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Subido el{" "}
                      {new Date(doc.uploadDate).toLocaleDateString("es-MX")}
                    </p>
                  </div>
                  {getStatusBadge(doc.status)}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUpload(doc.type)}
                >
                  {doc.status === "pendiente" || doc.status === "rechazado"
                    ? "Reemplazar"
                    : "Actualizar"}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Documentos adicionales */}
      <Card>
        <CardHeader>
          <CardTitle>Otros documentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <p className="font-medium text-foreground">
                  Acuerdo de prestación de servicios
                </p>
                <p className="text-sm text-muted-foreground">
                  Contrato entre terapeuta y Vittare
                </p>
              </div>
              <Button size="sm" variant="outline">
                Descargar
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <p className="font-medium text-foreground">
                  Aviso de privacidad
                </p>
                <p className="text-sm text-muted-foreground">
                  Políticas de manejo de datos
                </p>
              </div>
              <Button size="sm" variant="outline">
                Descargar
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <p className="font-medium text-foreground">
                  Consentimiento informado (plantilla)
                </p>
                <p className="text-sm text-muted-foreground">
                  Para uso con pacientes
                </p>
              </div>
              <Button size="sm" variant="outline">
                Descargar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
