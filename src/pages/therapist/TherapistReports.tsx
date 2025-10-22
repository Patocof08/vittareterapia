import { BarChart3, Download, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function TherapistReports() {
  const handleExport = (type: string) => {
    toast.success(`Exportando reporte de ${type}...`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Reportes</h1>
        <p className="text-muted-foreground mt-1">
          Analiza y exporta tus datos
        </p>
      </div>

      {/* Selección de periodo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Periodo de análisis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <Select defaultValue="este-mes">
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="Seleccionar periodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="esta-semana">Esta semana</SelectItem>
                <SelectItem value="este-mes">Este mes</SelectItem>
                <SelectItem value="ultimo-mes">Último mes</SelectItem>
                <SelectItem value="ultimo-trimestre">
                  Último trimestre
                </SelectItem>
                <SelectItem value="este-año">Este año</SelectItem>
                <SelectItem value="personalizado">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tipos de reportes */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Reporte de sesiones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Exporta un resumen de todas tus sesiones: paciente, fecha, duración,
              estado y notas.
            </p>
            <div className="space-y-2">
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => handleExport("sesiones CSV")}
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar CSV
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => handleExport("sesiones PDF")}
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reporte de asistencia</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Analiza las tasas de asistencia, cancelaciones y no-shows de tus
              pacientes.
            </p>
            <div className="space-y-2">
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => handleExport("asistencia CSV")}
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar CSV
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => handleExport("asistencia PDF")}
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reporte de ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Resume tus ingresos por periodo, paciente y tipo de sesión.
            </p>
            <div className="space-y-2">
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => handleExport("ingresos CSV")}
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar CSV
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => handleExport("ingresos PDF")}
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reporte personalizado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Crea un reporte personalizado con los campos que necesites.
            </p>
            <Button className="w-full" variant="default">
              <BarChart3 className="w-4 h-4 mr-2" />
              Crear reporte personalizado
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
