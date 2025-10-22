import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function TherapistProfile() {
  const [editing, setEditing] = useState(false);

  const handleSave = () => {
    setEditing(false);
    toast.success("Perfil actualizado correctamente");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mi Perfil</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tu información profesional
          </p>
        </div>
        <Button
          onClick={() => editing ? handleSave() : setEditing(true)}
          variant={editing ? "default" : "outline"}
        >
          {editing ? "Guardar" : "Editar Perfil"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información Personal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nombre</Label>
              <Input disabled={!editing} placeholder="Tu nombre" />
            </div>
            <div>
              <Label>Apellido</Label>
              <Input disabled={!editing} placeholder="Tu apellido" />
            </div>
          </div>
          <div>
            <Label>Email</Label>
            <Input disabled={!editing} type="email" placeholder="tu@email.com" />
          </div>
          <div>
            <Label>Teléfono</Label>
            <Input disabled={!editing} placeholder="+52 555 123 4567" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información Profesional</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Biografía</Label>
            <Textarea 
              disabled={!editing} 
              placeholder="Cuéntanos sobre tu experiencia y enfoque terapéutico"
              rows={4}
            />
          </div>
          <div>
            <Label>Años de experiencia</Label>
            <Input disabled={!editing} type="number" placeholder="0" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
