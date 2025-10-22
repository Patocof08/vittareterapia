import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Info, TrendingUp, Package, Users } from "lucide-react";
import { Link } from "react-router-dom";

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="bg-gradient-to-br from-primary to-primary-dark text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Precios transparentes y flexibles</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Paga por sesión individual o ahorra con paquetes mensuales personalizados con tu terapeuta
          </p>
        </div>
      </section>

      {/* Pricing Options */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            {/* Individual Sessions */}
            <div className="mb-12">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">Sesiones Individuales</h2>
                <p className="text-muted-foreground">Sin compromiso, paga solo por lo que necesitas</p>
              </div>

              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="text-2xl">Sesión Individual</CardTitle>
                  <CardDescription>Perfecta para probar nuestros servicios</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-primary/10 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground mb-2">Precio por sesión</p>
                      <p className="text-2xl font-bold">Desde $500 MXN</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        El precio varía según el terapeuta que elijas
                      </p>
                    </div>

                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Sesión de 50 minutos</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Videollamada segura y confidencial</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Facturación disponible (CFDI)</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Sin compromiso a largo plazo</span>
                      </li>
                    </ul>

                    <Link to="/therapists">
                      <Button variant="default" className="w-full" size="lg">
                        Ver terapeutas disponibles
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Package Subscriptions */}
            <div>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">Paquetes con Descuento</h2>
                <p className="text-muted-foreground">Suscripciones mensuales con tu terapeuta favorito</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Paquete 4 Sesiones */}
                <Card className="border-2 hover:shadow-lg transition-all">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle className="text-2xl">Paquete Básico</CardTitle>
                      <Badge variant="secondary">10% OFF</Badge>
                    </div>
                    <CardDescription>4 sesiones mensuales</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-primary/10 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground mb-2">Ahorro mensual</p>
                      <p className="text-2xl font-bold">10% de descuento</p>
                      <p className="text-sm text-muted-foreground mt-1">sobre el precio del terapeuta</p>
                    </div>

                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">4 sesiones al mes</p>
                          <p className="text-xs text-muted-foreground">De 50 minutos cada una</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <TrendingUp className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Rollover del 25%</p>
                          <p className="text-xs text-muted-foreground">1 sesión se transfiere al siguiente mes</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <Package className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Renovación automática</p>
                          <p className="text-xs text-muted-foreground">Cancela cuando quieras</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <Users className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Compromiso con tu terapeuta</p>
                          <p className="text-xs text-muted-foreground">Mejor continuidad en tu proceso</p>
                        </div>
                      </li>
                    </ul>

                    <Link to="/therapists">
                      <Button className="w-full" size="lg">
                        Elegir terapeuta
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Paquete 8 Sesiones */}
                <Card className="border-2 border-primary hover:shadow-lg transition-all relative">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1">Más Popular</Badge>
                  </div>
                  <CardHeader className="pt-8">
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle className="text-2xl">Paquete Premium</CardTitle>
                      <Badge>20% OFF</Badge>
                    </div>
                    <CardDescription>8 sesiones mensuales</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-primary/10 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground mb-2">Ahorro mensual</p>
                      <p className="text-2xl font-bold">20% de descuento</p>
                      <p className="text-sm text-muted-foreground mt-1">sobre el precio del terapeuta</p>
                    </div>

                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">8 sesiones al mes</p>
                          <p className="text-xs text-muted-foreground">De 50 minutos cada una</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <TrendingUp className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Rollover del 25%</p>
                          <p className="text-xs text-muted-foreground">2 sesiones se transfieren al siguiente mes</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <Package className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Renovación automática</p>
                          <p className="text-xs text-muted-foreground">Cancela cuando quieras</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <Users className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Compromiso con tu terapeuta</p>
                          <p className="text-xs text-muted-foreground">Mejor continuidad en tu proceso</p>
                        </div>
                      </li>
                    </ul>

                    <Link to="/therapists">
                      <Button variant="hero" className="w-full" size="lg">
                        Elegir terapeuta
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>

              {/* Información sobre paquetes */}
              <Card className="bg-muted/50 border-muted">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5 text-primary" />
                    Información importante sobre los paquetes
                  </h3>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-2" />
                      <span>
                        <strong className="text-foreground">Precios personalizados:</strong> Cada terapeuta establece su
                        precio de sesión individual. Los descuentos del paquete (10% o 20%) se aplican sobre ese precio
                        base.
                      </span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-2" />
                      <span>
                        <strong className="text-foreground">Rollover automático:</strong> El 25% del total de sesiones
                        del paquete (no solo las no utilizadas) se transfiere automáticamente al siguiente mes. Por
                        ejemplo, en el paquete de 8 sesiones, siempre se transfieren 2 sesiones (25% de 8), sin importar
                        cuántas uses.
                      </span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-2" />
                      <span>
                        <strong className="text-foreground">Suscripción flexible:</strong> Los paquetes se renuevan
                        automáticamente cada mes para mantener tu continuidad terapéutica. Puedes cancelar en cualquier
                        momento sin penalización.
                      </span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-2" />
                      <span>
                        <strong className="text-foreground">Por terapeuta:</strong> Las suscripciones son específicas
                        para cada terapeuta. Si trabajas con múltiples terapeutas, puedes tener paquetes separados con
                        cada uno.
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Example */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Ejemplo de precios</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sesión Individual</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm text-muted-foreground">Precio terapeuta:</span>
                      <span className="font-semibold">$800</span>
                    </div>
                    <div className="flex justify-between items-baseline pt-2 border-t">
                      <span className="text-sm font-medium">Total por sesión:</span>
                      <span className="text-xl font-bold">$800</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/50">
                <CardHeader>
                  <CardTitle className="text-lg">Paquete 4 Sesiones</CardTitle>
                  <Badge variant="secondary" className="w-fit">
                    10% OFF
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm text-muted-foreground">Precio original:</span>
                      <span className="line-through">$3,200</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm text-muted-foreground">Descuento 10%:</span>
                      <span className="text-green-600">-$320</span>
                    </div>
                    <div className="flex justify-between items-baseline pt-2 border-t">
                      <span className="text-sm font-medium">Total mensual:</span>
                      <span className="text-xl font-bold">$2,880</span>
                    </div>
                    <p className="text-xs text-muted-foreground">$720 por sesión</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="text-lg">Paquete 8 Sesiones</CardTitle>
                  <Badge className="w-fit">20% OFF</Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm text-muted-foreground">Precio original:</span>
                      <span className="line-through">$6,400</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm text-muted-foreground">Descuento 20%:</span>
                      <span className="text-green-600">-$1,280</span>
                    </div>
                    <div className="flex justify-between items-baseline pt-2 border-t">
                      <span className="text-sm font-medium">Total mensual:</span>
                      <span className="text-xl font-bold">$5,120</span>
                    </div>
                    <p className="text-xs text-muted-foreground">$640 por sesión</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-6">
              * Ejemplo basado en un precio de sesión de $800. Los precios reales varían según el terapeuta.
            </p>
          </div>
        </div>
      </section>

      {/* Policies */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Políticas y condiciones</h2>

            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Info className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-2">Política de cancelación</h3>
                      <p className="text-sm text-muted-foreground">
                        Puedes cancelar o reprogramar tu sesión con al menos 24 horas de anticipación sin cargo.
                        Cancelaciones con menos de 24 horas se cobrarán el 50% del valor de la sesión.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Info className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-2">Gestión de suscripciones</h3>
                      <p className="text-sm text-muted-foreground">
                        Puedes cancelar tu suscripción en cualquier momento desde tu portal de cliente. Al cancelar,
                        seguirás teniendo acceso hasta el final del período de facturación actual. No se realizan
                        reembolsos por periodos parciales, pero las sesiones no utilizadas se respetan según el sistema
                        de rollover.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Info className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-2">Facturación</h3>
                      <p className="text-sm text-muted-foreground">
                        Emitimos facturas fiscales (CFDI) para todos los pagos. Puedes solicitarla al momento del pago o
                        después desde tu cuenta. Las facturas se envían en un plazo máximo de 72 horas.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Info className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-2">Métodos de pago</h3>
                      <p className="text-sm text-muted-foreground">
                        Aceptamos tarjetas de crédito y débito (Visa, Mastercard, American Express), transferencias
                        bancarias y pagos a través de PayPal. Todos los pagos son procesados de forma segura.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary to-primary-dark text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">¿Tienes dudas sobre nuestros precios?</h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Estamos aquí para ayudarte. Contáctanos y resolveremos todas tus preguntas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact">
              <Button variant="secondary" size="lg">
                Contactar
              </Button>
            </Link>
            <Link to="/therapists">
              <Button variant="hero" size="lg">
                Ver terapeutas
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;
