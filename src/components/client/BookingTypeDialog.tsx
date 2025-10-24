import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, Package, CreditCard, Info } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BookingTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pricing: {
    session_price: number;
    package_4_price?: number;
    package_8_price?: number;
    first_session_price?: number;
    currency: string;
  };
  onConfirm: (type: "single" | "package_4" | "package_8") => void;
}

export function BookingTypeDialog({
  open,
  onOpenChange,
  pricing,
  onConfirm,
}: BookingTypeDialogProps) {
  const [selectedType, setSelectedType] = useState<"single" | "package_4" | "package_8">("single");
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);

  const handleConfirm = () => {
    onConfirm(selectedType);
    onOpenChange(false);
  };

  const calculateSavings = (packagePrice: number, sessions: number) => {
    const regularTotal = pricing.session_price * sessions;
    const savings = regularTotal - packagePrice;
    const percentage = Math.round((savings / regularTotal) * 100);
    return { savings, percentage };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Selecciona tu plan</DialogTitle>
          <DialogDescription>
            Elige entre una sesión individual o un paquete para obtener descuentos
          </DialogDescription>
        </DialogHeader>

        <RadioGroup
          value={selectedType}
          onValueChange={(value: any) => setSelectedType(value)}
          className="space-y-3"
        >
          {/* Single Session */}
          <div className="relative">
            <RadioGroupItem value="single" id="single" className="peer sr-only" />
            <Label
              htmlFor="single"
              className="flex flex-col p-4 border-2 rounded-lg cursor-pointer hover:bg-accent transition-colors peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span className="font-semibold">Sesión Individual</span>
                </div>
                <span className="text-2xl font-bold">
                  ${pricing.first_session_price || pricing.session_price}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Paga una sola sesión
              </p>
              {pricing.first_session_price && (
                <Badge variant="secondary" className="w-fit mt-2">
                  Precio especial primera sesión
                </Badge>
              )}
            </Label>
          </div>

          {/* Package 4 */}
          {pricing.package_4_price && (
            <div className="relative">
              <RadioGroupItem value="package_4" id="package_4" className="peer sr-only" />
              <Label
                htmlFor="package_4"
                className="flex flex-col p-4 border-2 rounded-lg cursor-pointer hover:bg-accent transition-colors peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    <span className="font-semibold">Paquete 4 Sesiones</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold">${pricing.package_4_price}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    ${(pricing.package_4_price / 4).toFixed(2)} por sesión
                  </p>
                  <Badge variant="default" className="ml-auto">
                    Ahorra {calculateSavings(pricing.package_4_price, 4).percentage}%
                  </Badge>
                </div>
              </Label>
            </div>
          )}

          {/* Package 8 */}
          {pricing.package_8_price && (
            <div className="relative">
              <RadioGroupItem value="package_8" id="package_8" className="peer sr-only" />
              <Label
                htmlFor="package_8"
                className="flex flex-col p-4 border-2 rounded-lg cursor-pointer hover:bg-accent transition-colors peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    <span className="font-semibold">Paquete 8 Sesiones</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold">${pricing.package_8_price}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    ${(pricing.package_8_price / 8).toFixed(2)} por sesión
                  </p>
                  <Badge variant="default" className="ml-auto">
                    Ahorra {calculateSavings(pricing.package_8_price, 8).percentage}%
                  </Badge>
                </div>
              </Label>
            </div>
          )}
        </RadioGroup>

        <div className="flex gap-3 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleConfirm} className="flex-1">
            <CreditCard className="w-4 h-4 mr-2" />
            Continuar
          </Button>
        </div>

        <div className="flex items-center justify-center gap-2 mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setInfoDialogOpen(true)}
            className="text-xs"
          >
            <Info className="w-3 h-3 mr-1" />
            ¿Cómo funcionan los paquetes?
          </Button>
        </div>
        
        <p className="text-xs text-center text-muted-foreground mt-2">
          Los paquetes aparecerán en tu dashboard de suscripciones
        </p>
      </DialogContent>

      {/* Info Dialog */}
      <AlertDialog open={infoDialogOpen} onOpenChange={setInfoDialogOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cómo funcionan los paquetes de sesiones?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4 text-left">
              <div>
                <h4 className="font-semibold text-foreground mb-2">📦 Suscripciones Mensuales</h4>
                <p>
                  Los paquetes son suscripciones mensuales que se renuevan automáticamente. 
                  Recibes tus sesiones al inicio de cada período y puedes usarlas durante el mes.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-foreground mb-2">💰 Descuentos Automáticos</h4>
                <p>
                  Mientras más sesiones incluya tu paquete, mayor será el descuento por sesión. 
                  El paquete de 8 sesiones ofrece el mejor precio unitario.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-foreground mb-2">🔄 Rollover del 25%</h4>
                <p>
                  Si no usas todas tus sesiones en el mes, el 25% del total del paquete se transfiere 
                  automáticamente al siguiente mes. Por ejemplo, en un paquete de 4 sesiones, 
                  1 sesión puede transferirse al siguiente período.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-foreground mb-2">❌ Cancelación de Sesiones</h4>
                <p>
                  Si cancelas una sesión con más de 24 horas de anticipación, el crédito vuelve 
                  automáticamente a tu paquete. Si cancelas con menos de 24 horas, se considera 
                  utilizada.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-foreground mb-2">🔁 Renovación y Cancelación</h4>
                <p>
                  Puedes cancelar la renovación automática en cualquier momento desde tu dashboard. 
                  Tu paquete seguirá activo hasta el final del período actual.
                </p>
              </div>
              
              <div className="bg-primary/10 p-3 rounded-lg mt-4">
                <p className="text-sm">
                  <strong>💡 Recomendación:</strong> Si planeas tener sesiones regulares, 
                  los paquetes son la mejor opción para ahorrar dinero y asegurar tu continuidad terapéutica.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setInfoDialogOpen(false)}>
              Entendido
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
