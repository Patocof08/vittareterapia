import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { logger } from "@/lib/logger";

interface ProfileData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  bio_short: string;
  bio_extended: string;
  years_experience: number;
  specialties: string[];
  therapeutic_approaches: string[];
  languages: string[];
  verification_status: string;
  verification_notes: string | null;
}

// Campos sensibles que requieren re-revisión
const SENSITIVE_FIELDS = [
  'bio_short',
  'bio_extended', 
  'years_experience',
  'specialties',
  'therapeutic_approaches'
];

export default function TherapistProfile() {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [formData, setFormData] = useState<Partial<ProfileData>>({});

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("psychologist_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfileData(data as ProfileData);
        setFormData(data);
      }
    } catch (error) {
      logger.error("Error loading profile:", error);
      toast.error("Error al cargar el perfil");
    } finally {
      setLoading(false);
    }
  };

  const checkIfSensitiveFieldsChanged = () => {
    if (!profileData) return false;

    return SENSITIVE_FIELDS.some(field => {
      const oldValue = profileData[field as keyof ProfileData];
      const newValue = formData[field as keyof ProfileData];
      
      if (Array.isArray(oldValue) && Array.isArray(newValue)) {
        return JSON.stringify(oldValue) !== JSON.stringify(newValue);
      }
      return oldValue !== newValue;
    });
  };

  const handleSave = async () => {
    if (!user || !profileData) return;

    setSaving(true);
    try {
      const sensitiveChanged = checkIfSensitiveFieldsChanged();
      const updateData: any = { ...formData };

      // Si cambió un campo sensible, poner en revisión
      if (sensitiveChanged) {
        updateData.verification_status = 'pending';
        updateData.is_published = false;
      }

      const { error } = await supabase
        .from("psychologist_profiles")
        .update(updateData)
        .eq("user_id", user.id);

      if (error) throw error;

      setEditing(false);
      await loadProfile();
      
      if (sensitiveChanged) {
        toast.warning("Perfil actualizado. Los cambios requieren revisión del equipo antes de publicarse.");
      } else {
        toast.success("Perfil actualizado correctamente");
      }
    } catch (error) {
      logger.error("Error saving profile:", error);
      toast.error("Error al guardar el perfil");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mi Perfil</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tu información profesional
          </p>
        </div>
        <div className="flex items-center gap-3">
          {profileData?.verification_status && (
            <Badge 
              variant={
                profileData.verification_status === 'approved' ? 'default' : 
                profileData.verification_status === 'pending' ? 'secondary' : 
                'destructive'
              }
            >
              {profileData.verification_status === 'approved' ? 'Aprobado' :
               profileData.verification_status === 'pending' ? 'En revisión' :
               'Rechazado'}
            </Badge>
          )}
          {editing && (
            <Button
              onClick={() => {
                setEditing(false);
                setFormData(profileData || {});
              }}
              variant="ghost"
            >
              Cancelar
            </Button>
          )}
          <Button
            onClick={() => editing ? handleSave() : setEditing(true)}
            variant={editing ? "default" : "outline"}
            disabled={saving}
          >
            {saving ? "Guardando..." : editing ? "Guardar" : "Editar Perfil"}
          </Button>
        </div>
      </div>

      {profileData?.verification_status === 'pending' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Tu perfil está en revisión. Te notificaremos cuando sea aprobado.
          </AlertDescription>
        </Alert>
      )}

      {profileData?.verification_status === 'rejected' && profileData?.verification_notes && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Perfil rechazado:</strong> {profileData.verification_notes}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Información Personal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nombre</Label>
              <Input 
                disabled={!editing} 
                value={formData.first_name || ''}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                placeholder="Tu nombre" 
              />
            </div>
            <div>
              <Label>Apellido</Label>
              <Input 
                disabled={!editing} 
                value={formData.last_name || ''}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                placeholder="Tu apellido" 
              />
            </div>
          </div>
          <div>
            <Label>Email</Label>
            <Input 
              disabled={!editing} 
              type="email" 
              value={formData.email || ''}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="tu@email.com" 
            />
          </div>
          <div>
            <Label>Teléfono</Label>
            <Input 
              disabled={!editing} 
              value={formData.phone || ''}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              placeholder="+52 555 123 4567" 
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información Profesional</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Los cambios en esta sección requieren revisión del equipo
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Biografía corta</Label>
            <Textarea 
              disabled={!editing} 
              value={formData.bio_short || ''}
              onChange={(e) => setFormData({...formData, bio_short: e.target.value})}
              placeholder="Resume tu perfil en pocas palabras"
              rows={3}
            />
          </div>
          <div>
            <Label>Biografía extendida</Label>
            <Textarea 
              disabled={!editing} 
              value={formData.bio_extended || ''}
              onChange={(e) => setFormData({...formData, bio_extended: e.target.value})}
              placeholder="Cuéntanos sobre tu experiencia y enfoque terapéutico"
              rows={6}
            />
          </div>
          <div>
            <Label>Años de experiencia</Label>
            <Input 
              disabled={!editing} 
              type="number" 
              value={formData.years_experience || ''}
              onChange={(e) => setFormData({...formData, years_experience: parseInt(e.target.value) || 0})}
              placeholder="0" 
            />
          </div>
          <div>
            <Label>Especialidades (separadas por coma)</Label>
            <Input 
              disabled={!editing}
              value={formData.specialties?.join(', ') || ''}
              onChange={(e) => setFormData({...formData, specialties: e.target.value.split(',').map(s => s.trim())})}
              placeholder="Psicología Clínica, Terapia de Pareja"
            />
          </div>
          <div>
            <Label>Enfoques terapéuticos (separados por coma)</Label>
            <Input 
              disabled={!editing}
              value={formData.therapeutic_approaches?.join(', ') || ''}
              onChange={(e) => setFormData({...formData, therapeutic_approaches: e.target.value.split(',').map(s => s.trim())})}
              placeholder="TCC, Humanista, Psicoanalítico"
            />
          </div>
          <div>
            <Label>Idiomas (separados por coma)</Label>
            <Input 
              disabled={!editing}
              value={formData.languages?.join(', ') || ''}
              onChange={(e) => setFormData({...formData, languages: e.target.value.split(',').map(s => s.trim())})}
              placeholder="Español, Inglés"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
