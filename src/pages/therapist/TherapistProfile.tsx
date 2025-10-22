import { User, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { mockTherapistData } from "@/data/therapistMockData";
import { toast } from "sonner";

export default function TherapistProfile() {
  const handleSave = () => {
    toast.success("Perfil actualizado correctamente");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Perfil</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona tu información profesional
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Foto de perfil */}
        <Card>
          <CardHeader>
            <CardTitle>Foto de perfil</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-center">
                <img
                  src={mockTherapistData.photo}
                  alt={mockTherapistData.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-border"
                />
              </div>
              <Button variant="outline" className="w-full">
                Cambiar foto
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Información básica */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Información básica</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre completo</Label>
                <Input
                  id="name"
                  defaultValue={mockTherapistData.name}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue={mockTherapistData.email}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  defaultValue={mockTherapistData.phone}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Información profesional */}
      <Card>
        <CardHeader>
          <CardTitle>Información profesional</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="cedula">Cédula profesional</Label>
              <Input
                id="cedula"
                defaultValue={mockTherapistData.cedula}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="specialty">Especialidad</Label>
              <Input
                id="specialty"
                defaultValue={mockTherapistData.specialty}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="experience">Años de experiencia</Label>
              <Input
                id="experience"
                type="number"
                defaultValue={mockTherapistData.yearsExperience}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Precio por sesión (MXN)</Label>
              <Input
                id="price"
                type="number"
                defaultValue={mockTherapistData.price}
              />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="approaches">Enfoques terapéuticos</Label>
              <Input
                id="approaches"
                defaultValue={mockTherapistData.approaches.join(", ")}
                placeholder="TCC, ACT, Mindfulness"
              />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="languages">Idiomas</Label>
              <Input
                id="languages"
                defaultValue={mockTherapistData.languages.join(", ")}
                placeholder="Español, Inglés"
              />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="bio">Biografía profesional</Label>
              <Textarea
                id="bio"
                rows={4}
                defaultValue={mockTherapistData.bio}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Políticas */}
      <Card>
        <CardHeader>
          <CardTitle>Políticas y preferencias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="cancellation">Política de cancelación</Label>
              <Textarea
                id="cancellation"
                rows={3}
                defaultValue="Cancelaciones con al menos 24 horas de anticipación sin cargo. Cancelaciones con menos de 24 horas se cobrarán el 50% del valor de la sesión."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="refund">Política de reembolsos</Label>
              <Textarea
                id="refund"
                rows={3}
                defaultValue="Los paquetes de sesiones no son reembolsables. En caso de cancelación por parte del terapeuta, se reprogramará sin cargo o se reembolsará el total."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botón guardar */}
      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          <Save className="w-4 h-4 mr-2" />
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}
