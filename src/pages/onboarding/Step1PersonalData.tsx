import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useOnboardingContext } from "@/hooks/useOnboarding";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, User } from "lucide-react";
import { toast } from "sonner";

const languages = ["Español", "Inglés", "Francés", "Alemán", "Portugués", "Italiano"];

export const Step1PersonalData = () => {
  const { data, updateData, nextStep, uploadFile } = useOnboardingContext();
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    first_name: data.first_name || "",
    last_name: data.last_name || "",
    email: data.email || "",
    phone: data.phone || "",
    city: data.city || "",
    country: data.country || "",
    languages: data.languages || [],
    modalities: ["Videollamada"], // Always videollamada
    profile_photo_url: data.profile_photo_url || "",
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: "languages" | "modalities", value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value],
    }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor selecciona una imagen");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no debe superar 5MB");
      return;
    }

    setUploading(true);
    const url = await uploadFile(file, "photo");
    if (url) {
      handleChange("profile_photo_url", url);
      toast.success("Foto subida correctamente");
    }
    setUploading(false);
  };

  const validateForm = () => {
    if (!formData.first_name.trim()) {
      toast.error("El nombre es obligatorio");
      return false;
    }
    if (!formData.last_name.trim()) {
      toast.error("Los apellidos son obligatorios");
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      toast.error("Ingresa un email válido");
      return false;
    }
    if (!formData.phone.trim()) {
      toast.error("El teléfono es obligatorio");
      return false;
    }
    if (!formData.city.trim()) {
      toast.error("La ciudad es obligatoria");
      return false;
    }
    if (!formData.country.trim()) {
      toast.error("El país es obligatorio");
      return false;
    }
    if (formData.languages.length === 0) {
      toast.error("Selecciona al menos un idioma");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateForm()) return;
    updateData(formData);
    nextStep();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Datos personales y contacto</CardTitle>
          <CardDescription>
            Información básica sobre ti. Los campos marcados con * son obligatorios.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Photo Upload */}
          <div className="flex flex-col items-center gap-4">
            <Avatar className="w-32 h-32">
              <AvatarImage src={formData.profile_photo_url} />
              <AvatarFallback>
                <User className="w-16 h-16" />
              </AvatarFallback>
            </Avatar>
            <div>
              <input
                type="file"
                id="photo-upload"
                className="hidden"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={uploading}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("photo-upload")?.click()}
                disabled={uploading}
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? "Subiendo..." : "Subir foto de perfil"}
              </Button>
            </div>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Nombre(s) *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleChange("first_name", e.target.value)}
                placeholder="Tu nombre"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Apellidos *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleChange("last_name", e.target.value)}
                placeholder="Tus apellidos"
              />
            </div>
          </div>

          {/* Contact Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="tu@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+52 123 456 7890"
              />
            </div>
          </div>

          {/* Location Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Ciudad *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
                placeholder="Ciudad de México"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">País *</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => handleChange("country", e.target.value)}
                placeholder="México"
              />
            </div>
          </div>

          {/* Languages */}
          <div className="space-y-3">
            <Label>Idiomas de atención *</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {languages.map((lang) => (
                <div key={lang} className="flex items-center space-x-2">
                  <Checkbox
                    id={`lang-${lang}`}
                    checked={formData.languages.includes(lang)}
                    onCheckedChange={() => toggleArrayItem("languages", lang)}
                  />
                  <Label htmlFor={`lang-${lang}`} className="cursor-pointer font-normal">
                    {lang}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Info about modality */}
          <div className="p-4 bg-muted/50 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">
              <strong>Modalidad:</strong> Todas las sesiones serán por videollamada
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleNext} size="lg">
          Siguiente
        </Button>
      </div>
    </div>
  );
};
