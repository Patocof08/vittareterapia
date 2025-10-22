import { useState, useEffect } from "react";
import { User, Mail, Lock, CreditCard, Bell, Trash2, Package, HelpCircle, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Download } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProfileData {
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
}

export default function ClientSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    full_name: "",
    email: user?.email || "",
    phone: "",
    avatar_url: ""
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfileData({
          full_name: data.full_name || "",
          email: data.email || user?.email || "",
          phone: data.phone || "",
          avatar_url: data.avatar_url || ""
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.full_name,
          phone: profileData.phone
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: "Perfil actualizado",
        description: "Tus datos han sido guardados correctamente."
      });
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

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada correctamente."
      });

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      setProfileData({ ...profileData, avatar_url: publicUrl });

      toast({
        title: "Foto actualizada",
        description: "Tu foto de perfil ha sido actualizada."
      });
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Ajustes
        </h1>
        <p className="text-muted-foreground mt-1">
          Gestiona tu cuenta y preferencias
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="profile">Mi Perfil</TabsTrigger>
          <TabsTrigger value="security">Seguridad</TabsTrigger>
          <TabsTrigger value="payment-methods">Métodos de Pago</TabsTrigger>
          <TabsTrigger value="subscription">Suscripción</TabsTrigger>
          <TabsTrigger value="payments">Pagos</TabsTrigger>
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
          <TabsTrigger value="delete">Eliminar Cuenta</TabsTrigger>
        </TabsList>

        {/* Mi Perfil */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Información Personal
              </CardTitle>
              <CardDescription>
                Actualiza tu información y foto de perfil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Foto de Perfil */}
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {profileData.avatar_url ? (
                    <img 
                      src={profileData.avatar_url} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Sube una foto de perfil para personalizar tu cuenta
                  </p>
                  <div className="relative">
                    <Input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => document.getElementById('avatar-upload')?.click()}
                      disabled={loading}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Subir Foto
                    </Button>
                  </div>
                </div>
              </div>

              {/* Datos Personales */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre Completo</Label>
                  <Input 
                    id="name" 
                    type="text" 
                    placeholder="Tu nombre"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={profileData.email} 
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    placeholder="+52 123 456 7890"
                    value={profileData.phone || ""}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  />
                </div>

                <Button onClick={handleProfileUpdate} disabled={loading}>
                  {loading ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Seguridad */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Cambiar Contraseña
              </CardTitle>
              <CardDescription>
                Actualiza tu contraseña para mantener tu cuenta segura
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Contraseña Actual</Label>
                <Input 
                  id="current-password" 
                  type="password" 
                  placeholder="••••••••"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">Nueva Contraseña</Label>
                <Input 
                  id="new-password" 
                  type="password" 
                  placeholder="••••••••"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                <Input 
                  id="confirm-password" 
                  type="password" 
                  placeholder="••••••••"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                />
              </div>

              <Button onClick={handlePasswordChange} disabled={loading}>
                {loading ? "Cambiando..." : "Cambiar Contraseña"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Métodos de Pago */}
        <TabsContent value="payment-methods" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Métodos de Pago
              </CardTitle>
              <CardDescription>
                Gestiona tus tarjetas y métodos de pago
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  No tienes métodos de pago guardados
                </p>
                <Button>
                  Agregar Método de Pago
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suscripción */}
        <TabsContent value="subscription" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Mi Suscripción
              </CardTitle>
              <CardDescription>
                Gestiona tus paquetes de sesiones mensuales
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Créditos Disponibles */}
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Sesiones Disponibles</p>
                    <p className="text-3xl font-bold text-foreground">0</p>
                  </div>
                  <Package className="w-12 h-12 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No tienes sesiones disponibles en tu cuenta
                </p>
              </div>

              {/* Paquetes Disponibles */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Paquetes Disponibles</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-xl">Paquete Básico</CardTitle>
                      <CardDescription>4 sesiones mensuales</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-3xl font-bold">$280</p>
                        <p className="text-sm text-muted-foreground">
                          $70 por sesión (ahorra 12%)
                        </p>
                      </div>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          <span>4 sesiones al mes</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          <span>25% se transfiere al siguiente mes</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          <span>Cambio de terapeuta disponible</span>
                        </li>
                      </ul>
                      <Button className="w-full">Comprar Paquete</Button>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-primary">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl">Paquete Premium</CardTitle>
                          <CardDescription>8 sesiones mensuales</CardDescription>
                        </div>
                        <Badge>Más Popular</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-3xl font-bold">$520</p>
                        <p className="text-sm text-muted-foreground">
                          $65 por sesión (ahorra 19%)
                        </p>
                      </div>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          <span>8 sesiones al mes</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          <span>25% se transfiere al siguiente mes</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          <span>Cambio de terapeuta disponible</span>
                        </li>
                      </ul>
                      <Button className="w-full">Comprar Paquete</Button>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* FAQs */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  Preguntas Frecuentes sobre Suscripciones
                </h3>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>¿Cómo funciona el sistema de créditos?</AccordionTrigger>
                    <AccordionContent>
                      Compras un paquete de sesiones que se cargan a tu cuenta como créditos. Puedes usar estas sesiones 
                      cuando quieras durante el mes con cualquier terapeuta disponible. Es como tener un monedero de sesiones.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger>¿Qué pasa con las sesiones no utilizadas?</AccordionTrigger>
                    <AccordionContent>
                      El 25% de tus sesiones no utilizadas se transfieren automáticamente al siguiente mes. Por ejemplo, 
                      si te quedan 4 sesiones del paquete de 8, una sesión (25%) se agregará a tu cuenta el próximo mes.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3">
                    <AccordionTrigger>¿Puedo cambiar de terapeuta?</AccordionTrigger>
                    <AccordionContent>
                      Sí, puedes usar tus sesiones con diferentes terapeutas. Si cambias a un terapeuta con precio diferente, 
                      solo pagas la diferencia (con descuento del paquete). Si es más barato, la diferencia se convierte en créditos adicionales.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-4">
                    <AccordionTrigger>¿Los paquetes se renuevan automáticamente?</AccordionTrigger>
                    <AccordionContent>
                      Los paquetes tienen vigencia mensual pero NO se renuevan automáticamente. Tú decides cuándo comprar 
                      más sesiones según tus necesidades. Esto te da total control sobre tu inversión en terapia.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-5">
                    <AccordionTrigger>¿Puedo comprar sesiones individuales?</AccordionTrigger>
                    <AccordionContent>
                      Sí, siempre puedes agendar sesiones individuales directamente con tu terapeuta al precio regular. 
                      Los paquetes son opcionales y solo ofrecen descuentos adicionales si decides comprar varias sesiones.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Historial de Pagos */}
        <TabsContent value="payments" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Pagado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">$0.00</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Sesiones Pagadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">0</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pendientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">$0.00</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Historial de Pagos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Ejemplo de pago */}
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">
                      Sesión Individual
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      01/12/2025
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Pagado
                    </Badge>
                    <p className="font-bold">$80.00</p>
                    <Button size="icon" variant="ghost">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notificaciones */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Preferencias de Notificaciones
              </CardTitle>
              <CardDescription>
                Controla qué notificaciones quieres recibir
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Recordatorios de Sesiones</p>
                    <p className="text-sm text-muted-foreground">
                      Recibe notificaciones antes de tus sesiones programadas
                    </p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Nuevos Mensajes</p>
                    <p className="text-sm text-muted-foreground">
                      Notificaciones cuando recibas mensajes de tu terapeuta
                    </p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Tareas Asignadas</p>
                    <p className="text-sm text-muted-foreground">
                      Avisos sobre nuevas tareas o ejercicios
                    </p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Confirmaciones de Pago</p>
                    <p className="text-sm text-muted-foreground">
                      Recibos y confirmaciones de transacciones
                    </p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Boletín y Promociones</p>
                    <p className="text-sm text-muted-foreground">
                      Consejos de bienestar y ofertas especiales
                    </p>
                  </div>
                  <input type="checkbox" className="w-5 h-5" />
                </div>
              </div>

              <Button>Guardar Preferencias</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Eliminar Cuenta */}
        <TabsContent value="delete" className="space-y-6">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="w-5 h-5" />
                Eliminar Cuenta
              </CardTitle>
              <CardDescription>
                Esta acción es permanente y no se puede deshacer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <h4 className="font-semibold mb-2 text-destructive">Antes de eliminar tu cuenta:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Se cancelarán todas tus sesiones programadas</li>
                  <li>• Perderás acceso a tu historial de sesiones</li>
                  <li>• Se eliminarán todos tus mensajes y datos</li>
                  <li>• Los paquetes no utilizados no serán reembolsables</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Descargar Mis Datos
                </Button>
                <Button variant="destructive" size="sm">
                  Eliminar Cuenta Permanentemente
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
