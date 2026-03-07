import { useState, useEffect } from "react";
import { User, Mail, Lock, CreditCard, Bell, Trash2, Package, HelpCircle, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { passwordSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
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
import { useNavigate } from "react-router-dom";
import ClientPayments from "./ClientPayments";

interface ProfileData {
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
}

interface ClientNotifPrefs {
  email_session_reminder: boolean;
  email_new_message: boolean;
  email_task_assigned: boolean;
  email_payment_update: boolean;
  email_cancellation: boolean;
  email_no_show: boolean;
  email_newsletter: boolean;
}

const DEFAULT_NOTIF_PREFS: ClientNotifPrefs = {
  email_session_reminder: true,
  email_new_message: true,
  email_task_assigned: true,
  email_payment_update: true,
  email_cancellation: true,
  email_no_show: true,
  email_newsletter: false,
};

export default function ClientSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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
  const [notifPrefs, setNotifPrefs] = useState<ClientNotifPrefs>(DEFAULT_NOTIF_PREFS);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadNotifPrefs();
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
          phone: (data as any).phone || "",
          avatar_url: (data as any).avatar_url || ""
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadNotifPrefs = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("notification_preferences")
        .select("email_session_reminder, email_new_message, email_task_assigned, email_payment_update, email_cancellation, email_no_show, email_newsletter")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setNotifPrefs({
          email_session_reminder: data.email_session_reminder ?? true,
          email_new_message: data.email_new_message ?? true,
          email_task_assigned: data.email_task_assigned ?? true,
          email_payment_update: data.email_payment_update ?? true,
          email_cancellation: data.email_cancellation ?? true,
          email_no_show: data.email_no_show ?? true,
          email_newsletter: data.email_newsletter ?? false,
        });
      }
    } catch {
      // Use defaults if no record exists yet
    }
  };

  const updateNotifPref = async (key: keyof ClientNotifPrefs, value: boolean) => {
    if (!user) return;
    const previous = notifPrefs;
    setNotifPrefs((prev) => ({ ...prev, [key]: value }));
    try {
      const { error } = await supabase
        .from("notification_preferences")
        .upsert({ user_id: user.id, user_type: "client", [key]: value }, { onConflict: "user_id" });
      if (error) throw error;
    } catch {
      setNotifPrefs(previous);
      toast({ title: "Error", description: "No se pudo guardar la preferencia.", variant: "destructive" });
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
        } as any)
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

    // Validate password strength using the same schema as registration
    const passwordValidation = passwordSchema.safeParse(passwordData.newPassword);
    if (!passwordValidation.success) {
      toast({
        title: "Error",
        description: passwordValidation.error.errors[0].message,
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
      if (!user) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para actualizar tu foto",
          variant: "destructive"
        });
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      // IMPORTANT: path must start with the user id to satisfy storage RLS policies
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl } as any)
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

  const handleDeleteAccount = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Call edge function to delete user account
      const { error: fnError } = await supabase.functions.invoke('delete-user-account');

      if (fnError) {
        throw new Error(fnError.message || 'Error al eliminar cuenta');
      }

      toast({
        title: "Cuenta eliminada",
        description: "Tu cuenta ha sido eliminada permanentemente."
      });

      // Sign out and redirect to home
      await supabase.auth.signOut();
      navigate("/");
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la cuenta",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setShowDeleteDialog(false);
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
        <div className="overflow-x-auto -mx-4 px-4">
          <TabsList className="inline-flex w-auto min-w-full md:grid md:w-full md:grid-cols-6">
            <TabsTrigger value="profile" className="whitespace-nowrap">Mi Perfil</TabsTrigger>
            <TabsTrigger value="security" className="whitespace-nowrap">Seguridad</TabsTrigger>
            <TabsTrigger value="payment-methods" className="whitespace-nowrap">Métodos de Pago</TabsTrigger>
            <TabsTrigger value="payments" className="whitespace-nowrap">Pagos</TabsTrigger>
            <TabsTrigger value="notifications" className="whitespace-nowrap">Notificaciones</TabsTrigger>
            <TabsTrigger value="delete" className="whitespace-nowrap">Eliminar</TabsTrigger>
          </TabsList>
        </div>

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
                Gestiona tus tarjetas y métodos de pago a través de Stripe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Desde el portal de pagos puedes actualizar tu tarjeta, ver tus recibos y gestionar tus suscripciones activas.
              </p>
              <Button
                onClick={async () => {
                  try {
                    setLoading(true);
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session?.access_token) {
                      toast({ title: "Error", description: "No se pudo verificar tu sesión", variant: "destructive" });
                      return;
                    }

                    const response = await fetch(
                      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-customer-portal`,
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          "Authorization": `Bearer ${session.access_token}`,
                          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                        },
                        body: JSON.stringify({
                          return_url: window.location.href,
                        }),
                      }
                    );

                    const result = await response.json();

                    if (!response.ok) {
                      toast({
                        title: "Error",
                        description: result.error || "No se pudo abrir el portal de pagos",
                        variant: "destructive",
                      });
                      return;
                    }

                    window.open(result.url, "_blank");
                  } catch (error: any) {
                    toast({
                      title: "Error",
                      description: error.message || "Error inesperado",
                      variant: "destructive",
                    });
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                {loading ? "Abriendo..." : "Gestionar métodos de pago"}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Serás redirigido al portal seguro de Stripe
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Historial de Pagos */}
        <TabsContent value="payments" className="space-y-6">
          <ClientPayments />
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
                Controla qué notificaciones quieres recibir por correo. Los cambios se guardan automáticamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Recordatorios de Sesiones</p>
                  <p className="text-sm text-muted-foreground">Recibe notificaciones antes de tus sesiones programadas</p>
                </div>
                <Switch
                  checked={notifPrefs.email_session_reminder}
                  onCheckedChange={(v) => updateNotifPref("email_session_reminder", v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Nuevos Mensajes</p>
                  <p className="text-sm text-muted-foreground">Notificaciones cuando recibas mensajes de tu terapeuta</p>
                </div>
                <Switch
                  checked={notifPrefs.email_new_message}
                  onCheckedChange={(v) => updateNotifPref("email_new_message", v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Tareas Asignadas</p>
                  <p className="text-sm text-muted-foreground">Avisos sobre nuevas tareas o ejercicios</p>
                </div>
                <Switch
                  checked={notifPrefs.email_task_assigned}
                  onCheckedChange={(v) => updateNotifPref("email_task_assigned", v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Confirmaciones de Pago</p>
                  <p className="text-sm text-muted-foreground">Recibos y confirmaciones de transacciones</p>
                </div>
                <Switch
                  checked={notifPrefs.email_payment_update}
                  onCheckedChange={(v) => updateNotifPref("email_payment_update", v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Cancelaciones</p>
                  <p className="text-sm text-muted-foreground">Notificación cuando se cancele una sesión</p>
                </div>
                <Switch
                  checked={notifPrefs.email_cancellation}
                  onCheckedChange={(v) => updateNotifPref("email_cancellation", v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Inasistencias</p>
                  <p className="text-sm text-muted-foreground">Notificación si se registra una inasistencia</p>
                </div>
                <Switch
                  checked={notifPrefs.email_no_show}
                  onCheckedChange={(v) => updateNotifPref("email_no_show", v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Boletín y Promociones</p>
                  <p className="text-sm text-muted-foreground">Consejos de bienestar y ofertas especiales</p>
                </div>
                <Switch
                  checked={notifPrefs.email_newsletter}
                  onCheckedChange={(v) => updateNotifPref("email_newsletter", v)}
                />
              </div>
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
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={loading}
                >
                  Eliminar Cuenta Permanentemente
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente tu cuenta
              y todos tus datos de nuestros servidores, incluyendo:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Tu perfil y datos personales</li>
                <li>Todas tus sesiones programadas</li>
                <li>Tu historial de sesiones</li>
                <li>Mensajes y conversaciones</li>
                <li>Suscripciones y paquetes</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Eliminando..." : "Sí, eliminar mi cuenta"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
