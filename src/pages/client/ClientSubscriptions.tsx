import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Package, Calendar, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
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

interface Subscription {
  id: string;
  psychologist_id: string;
  package_type: '4_sessions' | '8_sessions';
  session_price: number;
  discount_percentage: number;
  sessions_total: number;
  sessions_used: number;
  sessions_remaining: number;
  rollover_sessions: number;
  status: string;
  auto_renew: boolean;
  current_period_start: string;
  current_period_end: string;
  next_billing_date: string;
  psychologist_profiles: {
    first_name: string;
    last_name: string;
    profile_photo_url: string;
  };
}

export default function ClientSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('client_subscriptions')
        .select(`
          *,
          psychologist_profiles (
            first_name,
            last_name,
            profile_photo_url
          )
        `)
        .eq('client_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscriptions((data || []) as Subscription[]);
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
      const { error } = await supabase
        .from('client_subscriptions')
        .update({
          auto_renew: false,
          cancelled_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      if (error) throw error;

      toast({
        title: "Suscripción cancelada",
        description: "Tu suscripción se cancelará al final del período actual"
      });

      fetchSubscriptions();
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

  const handleReactivateSubscription = async (subscriptionId: string) => {
    try {
      const { error } = await supabase
        .from('client_subscriptions')
        .update({
          auto_renew: true,
          cancelled_at: null
        })
        .eq('id', subscriptionId);

      if (error) throw error;

      toast({
        title: "Suscripción reactivada",
        description: "Tu suscripción se renovará automáticamente"
      });

      fetchSubscriptions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const calculatePrice = (subscription: Subscription) => {
    const originalPrice = subscription.session_price * subscription.sessions_total;
    const discountedPrice = originalPrice * (1 - subscription.discount_percentage / 100);
    return {
      original: originalPrice,
      discounted: discountedPrice,
      perSession: discountedPrice / subscription.sessions_total
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Cargando suscripciones...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mis Suscripciones</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona tus paquetes de sesiones con cada terapeuta
        </p>
      </div>

      {subscriptions.length === 0 ? (
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
            const prices = calculatePrice(subscription);
            const sessionsText = subscription.package_type === '4_sessions' ? '4 sesiones' : '8 sesiones';
            const rolloverDisplay = subscription.rollover_sessions > 0;

            return (
              <Card key={subscription.id} className="overflow-hidden">
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
                            {subscription.psychologist_profiles.first_name[0]}
                            {subscription.psychologist_profiles.last_name[0]}
                          </span>
                        </div>
                      )}
                      <div>
                        <CardTitle>
                          {subscription.psychologist_profiles.first_name}{' '}
                          {subscription.psychologist_profiles.last_name}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Paquete de {sessionsText} • {subscription.discount_percentage}% descuento
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {subscription.auto_renew ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Renovación Automática
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
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Sesiones */}
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">
                        Sesiones Disponibles
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Sesiones totales</span>
                          <span className="font-bold">{subscription.sessions_total}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Sesiones usadas</span>
                          <span className="font-medium text-muted-foreground">
                            {subscription.sessions_used}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Sesiones restantes</span>
                          <span className="font-bold text-primary">
                            {subscription.sessions_remaining}
                          </span>
                        </div>
                        {rolloverDisplay && (
                          <div className="flex items-center justify-between pt-2 border-t">
                            <span className="text-sm flex items-center gap-1">
                              <TrendingUp className="w-4 h-4 text-primary" />
                              Rollover del próximo mes
                            </span>
                            <span className="font-bold text-primary">
                              {subscription.rollover_sessions.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Facturación */}
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">
                        Información de Pago
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Precio por sesión</span>
                          <div className="text-right">
                            <span className="font-bold">${prices.perSession.toFixed(2)}</span>
                            <span className="text-xs text-muted-foreground line-through ml-2">
                              ${subscription.session_price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Total del paquete</span>
                          <span className="font-bold">${prices.discounted.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-sm flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Próxima factura
                          </span>
                          <span className="font-medium">
                            {format(new Date(subscription.next_billing_date), 'dd MMM yyyy', { locale: es })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Período actual</span>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(subscription.current_period_start), 'dd MMM', { locale: es })} -{' '}
                            {format(new Date(subscription.current_period_end), 'dd MMM', { locale: es })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Información de Rollover */}
                  <div className="mt-6 p-4 bg-primary/10 rounded-lg">
                    <div className="flex gap-2">
                      <TrendingUp className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Sistema de Rollover Automático
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          El 25% del total de sesiones ({(subscription.sessions_total * 0.25).toFixed(1)} sesiones)
                          se transferirán automáticamente al siguiente mes si no las utilizas.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-3 mt-6">
                    {subscription.auto_renew ? (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedSubscription(subscription.id);
                          setCancelDialogOpen(true);
                        }}
                      >
                        Cancelar Renovación
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleReactivateSubscription(subscription.id)}
                      >
                        Reactivar Suscripción
                      </Button>
                    )}
                    <Button variant="ghost">
                      Ver Historial
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Cancel Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar renovación automática?</AlertDialogTitle>
            <AlertDialogDescription>
              Tu suscripción continuará activa hasta el final del período actual
              ({selectedSubscription && subscriptions.find(s => s.id === selectedSubscription)
                ? format(
                    new Date(subscriptions.find(s => s.id === selectedSubscription)!.current_period_end),
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
    </div>
  );
}
