import { useState } from "react";
import { DollarSign, Download, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { mockPayments, mockTherapistData } from "@/data/therapistMockData";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function TherapistPayments() {
  const [statusFilter, setStatusFilter] = useState<string>("todos");

  const filteredPayments = mockPayments.filter((payment) =>
    statusFilter === "todos" ? true : payment.status === statusFilter
  );

  const totalPaid = mockPayments
    .filter((p) => p.status === "pagado")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPending = mockPayments
    .filter((p) => p.status === "pendiente")
    .reduce((sum, p) => sum + p.amount, 0);

  const handleDownloadReceipt = (paymentId: string) => {
    toast.success("Descargando recibo...");
  };

  const handleExportReport = () => {
    toast.success("Exportando reporte...");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pagos</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tus ingresos y facturación
          </p>
        </div>
        <Button onClick={handleExportReport}>
          <Download className="w-4 h-4 mr-2" />
          Exportar reporte
        </Button>
      </div>

      {/* Resumen de ingresos */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos pagados</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ${totalPaid.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pagos pendientes
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">
              ${totalPending.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Por cobrar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Datos bancarios</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium text-foreground">
              {mockTherapistData.bankAccount}
            </div>
            <Button size="sm" variant="link" className="px-0 h-auto mt-1">
              Actualizar
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y tabla */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Historial de pagos</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pagado">Pagados</SelectItem>
                <SelectItem value="pendiente">Pendientes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <p className="text-muted-foreground">
                      No hay pagos con los filtros seleccionados
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {new Date(payment.date).toLocaleDateString("es-MX")}
                    </TableCell>
                    <TableCell>{payment.patientName}</TableCell>
                    <TableCell className="font-medium">
                      ${payment.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          payment.status === "pagado" ? "default" : "secondary"
                        }
                      >
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {payment.status === "pagado" && payment.receiptUrl && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownloadReceipt(payment.id)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Recibo
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
