import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Package, Calendar, TrendingUp, AlertCircle, CheckCircle2, Coins, HelpCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface Subscription {
  stripe_subscription_id: string;
  psychologist_id: string;
  package_type: 'package_4' | 'package_8';
  sessions: number;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  psychologist_profiles: {
    first_name: string;
    last_name: string;
    profile_photo_url: string;
  };
}

interface Credit {
  id: string;
  psychologist_id: string;
  amount: number;
  currency: string;
  reason: string;
  status: string;
  expires_at: string | null;
  created_at: string;
  psychologist_profiles: {
    first_name: string;
    last_name: string;
    profile_photo_url: string;
  };
}

export default function ClientSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsSubscription, setDetailsSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch subscriptions from Stripe via edge function
      const { data: stripeData, error: stripeError } = await supabase.functions.invoke('check-subscription');
      
      if (stripeError) throw stripeError;

      // Fetch psychologist profiles for each subscription
      const subscriptionsWithProfiles = await Promise.all(
        (stripeData?.subscriptions || []).map(async (sub: any) => {
          const { data: psychProfile } = await supabase
            .from('psychologist_profiles')
            .select('first_name, last_name, profile_photo_url')
            .eq('id', sub.psychologist_id)
            .single();

          return {
            ...sub,
            psychologist_profiles: psychProfile || {
              first_name: 'Desconocido',
              last_name: '',
              profile_photo_url: ''
            }
          };
        })
      );

      setSubscriptions(subscriptionsWithProfiles);

      // Fetch credits
      const { data: creditsData, error: creditsError } = await supabase
        .from('client_credits')
        .select(`
          *,
          psychologist_profiles (
            first_name,
            last_name,
            profile_photo_url
          )
        `)
        .eq('client_id', user.id)
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (creditsError) throw creditsError;
      setCredits((creditsData || []) as any);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    try {
      toast({
        title: "Función no disponible",
        description: "Por favor contacta a soporte para cancelar tu suscripción"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setCancelDialogOpen(false);
      setSelectedSubscription(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  const hasSubscriptions = subscriptions.length > 0;
  const hasCredits = credits.length > 0;
  const totalCreditsValue = credits.reduce((sum, credit) => sum + Number(credit.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mis Créditos y Suscripciones</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona tus paquetes mensuales y créditos disponibles
        </p>
      </div>

      {/* Summary Cards */}
      {(hasSubscriptions || hasCredits) && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                Suscripciones Activas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subscriptions.length}</div>
              <p className="text-xs text-muted-foreground">
                {subscriptions.reduce((sum, s) => sum + (s.sessions || (s.package_type === 'package_8' ? 8 : s.package_type === 'package_4' ? 4 : 0)), 0)} sesiones totales
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Coins className="w-4 h-4 text-primary" />
                Créditos Individuales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalCreditsValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {credits.length} {credits.length === 1 ? 'crédito disponible' : 'créditos disponibles'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Subscriptions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Package className="w-5 h-5" />
            Paquetes Mensuales
          </h2>
        </div>

        {!hasSubscriptions ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">
                No tienes suscripciones activas
              </p>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Compra un paquete de sesiones con tu terapeuta favorito para obtener descuentos
              </p>
              <Button onClick={() => navigate('/therapists')}>Explorar Terapeutas</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {subscriptions.map((subscription) => {
              const sessionsText = subscription.package_type === 'package_4' ? '4 sesiones' : '8 sesiones';
              const discountText = subscription.package_type === 'package_4' ? '10%' : '20%';
              const sessionsCount = subscription.sessions || (subscription.package_type === 'package_8' ? 8 : subscription.package_type === 'package_4' ? 4 : 0);

              return (
                <Card key={subscription.stripe_subscription_id} className="overflow-hidden">
                  <CardHeader className="bg-muted/50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        {subscription.psychologist_profiles.profile_photo_url ? (
                          <img
                            src={subscription.psychologist_profiles.profile_photo_url}
                            alt={`${subscription.psychologist_profiles.first_name} ${subscription.psychologist_profiles.last_name}`}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-2xl font-bold text-primary">
                              {subscription.psychologist_profiles.first_name?.[0] || '?'}
                              {subscription.psychologist_profiles.last_name?.[0] || ''}
                            </span>
                          </div>
                        )}
                        <div>
                          <CardTitle>
                            {subscription.psychologist_profiles.first_name}{' '}
                            {subscription.psychologist_profiles.last_name}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            Paquete de {sessionsText} • {discountText} descuento
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!subscription.cancel_at_period_end ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Activa
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Cancelada
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-6">
                    <div className="grid gap-6 md:grid-cols-1">
                      {/* Información de Suscripción */}
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-3">
                          Detalles de Suscripción
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Sesiones incluidas</span>
                            <span className="font-bold">{sessionsCount}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Inicio del período</span>
                            <span className="font-medium">
                              {subscription.current_period_start ? (
                                format(new Date(subscription.current_period_start), 'd MMM yyyy', { locale: es })
                              ) : (
                                '—'
                              )}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Fin del período</span>
                            <span className="font-medium">
                              {subscription.current_period_end ? (
                                format(new Date(subscription.current_period_end), 'd MMM yyyy', { locale: es })
                              ) : (
                                '—'
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-3 mt-6">
                      <Button onClick={handleManageSubscription}>
                        Gestionar Suscripción
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Separator />

      {/* Credits Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Coins className="w-5 h-5" />
            Créditos Individuales
          </h2>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Los créditos individuales son diferentes a las suscripciones. Se generan cuando cancelas 
            una sesión individual con más de 24 horas de anticipación. <strong>Nunca expiran</strong> y 
            puedes usarlos para agendar nuevas sesiones con cualquier psicólogo.
          </p>
        </div>

        {!hasCredits ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Coins className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">
                No tienes créditos disponibles
              </p>
              <p className="text-sm text-muted-foreground text-center">
                Los créditos se generan al cancelar sesiones individuales con anticipación
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {credits.map((credit) => (
              <Card key={credit.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {credit.psychologist_profiles.profile_photo_url ? (
                        <img
                          src={credit.psychologist_profiles.profile_photo_url}
                          alt={`${credit.psychologist_profiles.first_name} ${credit.psychologist_profiles.last_name}`}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-lg font-bold text-primary">
                            {credit.psychologist_profiles.first_name[0]}
                            {credit.psychologist_profiles.last_name[0]}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium">
                          {credit.psychologist_profiles.first_name} {credit.psychologist_profiles.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">{credit.reason}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Creado el {format(new Date(credit.created_at), 'dd MMM yyyy', { locale: es })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        ${Number(credit.amount).toFixed(2)}
                      </p>
                      <Badge variant="secondary" className="mt-2">Disponible</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* FAQs Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5" />
          <h2 className="text-xl font-semibold">Preguntas Frecuentes</h2>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>¿Cuál es la diferencia entre suscripciones y créditos?</AccordionTrigger>
            <AccordionContent>
              <strong>Suscripciones (Paquetes):</strong> Son planes mensuales con renovación automática. 
              Recibes un número fijo de sesiones cada mes con descuento. Incluyen sistema de rollover 
              del 25% de sesiones no utilizadas.
              <br /><br />
              <strong>Créditos Individuales:</strong> Son reembolsos monetarios que recibes al cancelar 
              sesiones individuales (no de paquetes) con más de 24 horas de anticipación. No se renuevan 
              automáticamente y puedes usarlos con cualquier psicólogo.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger>¿Cómo funciona el sistema de rollover?</AccordionTrigger>
            <AccordionContent>
              Si tienes sesiones sin usar al final del mes, el 25% del total de tu paquete se transfiere 
              automáticamente al siguiente período. Por ejemplo:
              <ul className="list-disc ml-6 mt-2">
                <li>Paquete de 4 sesiones → 1 sesión de rollover (25%)</li>
                <li>Paquete de 8 sesiones → 2 sesiones de rollover (25%)</li>
              </ul>
              <br />
              Este sistema te ayuda a no perder completamente las sesiones que no pudiste tomar.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger>¿Qué pasa si cancelo una sesión de mi suscripción?</AccordionTrigger>
            <AccordionContent>
              <strong>Con más de 24 horas de anticipación:</strong> El crédito de la sesión vuelve 
              automáticamente a tu paquete y puedes usarlo para agendar otra cita.
              <br /><br />
              <strong>Con menos de 24 horas:</strong> La sesión se considera utilizada y no se reembolsa 
              (política de cancelación tardía).
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger>¿Puedo usar mis créditos con cualquier psicólogo?</AccordionTrigger>
            <AccordionContent>
              <strong>Créditos de Suscripciones:</strong> Solo pueden usarse con el psicólogo específico 
              de ese paquete.
              <br /><br />
              <strong>Créditos Individuales:</strong> Puedes usarlos con cualquier psicólogo de la plataforma 
              (no están limitados a un terapeuta específico).
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5">
            <AccordionTrigger>¿Cómo cancelo mi suscripción?</AccordionTrigger>
            <AccordionContent>
              Puedes cancelar la renovación automática en cualquier momento haciendo clic en 
              "Cancelar Renovación" en la tarjeta de tu suscripción. Tu paquete seguirá activo 
              hasta el final del período actual que ya pagaste, y después no se realizarán más cargos.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-6">
            <AccordionTrigger>¿Los créditos expiran?</AccordionTrigger>
            <AccordionContent>
              <strong>Créditos de Suscripciones:</strong> Se rigen por el período mensual y el 
              sistema de rollover del 25%.
              <br /><br />
              <strong>Créditos Individuales:</strong> Nunca expiran. Puedes usarlos en cualquier 
              momento para agendar sesiones con cualquier psicólogo de la plataforma.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-7">
            <AccordionTrigger>¿Puedo transferir mis créditos o suscripción a otro psicólogo?</AccordionTrigger>
            <AccordionContent>
              Sí, puedes transferir tus créditos y suscripciones entre psicólogos. Solo necesitas 
              pagar la diferencia de precio entre los terapeutas (con el descuento de tu paquete ya 
              incluido). Contacta a nuestro equipo de soporte para procesar la transferencia y 
              continuar tu terapia con el profesional que mejor se ajuste a tus necesidades.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Cancel Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar renovación automática?</AlertDialogTitle>
            <AlertDialogDescription>
              Tu suscripción continuará activa hasta el final del período actual
              ({selectedSubscription && subscriptions.find(s => s.stripe_subscription_id === selectedSubscription)
                ? format(
                    new Date(subscriptions.find(s => s.stripe_subscription_id === selectedSubscription)!.current_period_end),
                    'dd MMMM yyyy',
                    { locale: es }
                  )
                : ''}). 
              Después de esa fecha, no se realizarán más cargos automáticos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedSubscription && handleCancelSubscription(selectedSubscription)}
            >
              Confirmar Cancelación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de detalles */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de Suscripción</DialogTitle>
            <DialogDescription>
              Para ver y gestionar todos los detalles de tu suscripción, usa el portal de gestión
            </DialogDescription>
          </DialogHeader>
          {detailsSubscription && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                {detailsSubscription.psychologist_profiles.profile_photo_url ? (
                  <img
                    src={detailsSubscription.psychologist_profiles.profile_photo_url}
                    alt={`${detailsSubscription.psychologist_profiles.first_name} ${detailsSubscription.psychologist_profiles.last_name}`}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">
                      {detailsSubscription.psychologist_profiles.first_name?.[0] || '?'}
                      {detailsSubscription.psychologist_profiles.last_name?.[0] || ''}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-lg">
                    {detailsSubscription.psychologist_profiles.first_name}{' '}
                    {detailsSubscription.psychologist_profiles.last_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Paquete de {detailsSubscription.package_type === 'package_4' ? '4' : '8'} sesiones
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Información del Período</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Inicio del período</span>
                      <span className="font-medium">
                        {format(new Date(detailsSubscription.current_period_start), "d 'de' MMMM, yyyy", { locale: es })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fin del período</span>
                      <span className="font-medium">
                        {format(new Date(detailsSubscription.current_period_end), "d 'de' MMMM, yyyy", { locale: es })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sesiones incluidas</span>
                      <span className="font-medium">{detailsSubscription.sessions}</span>
                    </div>
                  </div>
                </div>

                <Button onClick={handleManageSubscription} className="w-full">
                  Abrir Portal de Gestión
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}