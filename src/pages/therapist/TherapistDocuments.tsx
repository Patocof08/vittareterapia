import { FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

export default function TherapistDocuments() {
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
          <div className="text-center py-12">
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              No hay documentos cargados todavía
            </p>
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              Cargar documento
            </Button>
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
