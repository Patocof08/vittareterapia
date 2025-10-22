import { useState } from "react";
import { BookOpen, Upload, Share2, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockLibraryMaterials, mockPatients } from "@/data/therapistMockData";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function TherapistLibrary() {
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);

  const handleUpload = () => {
    toast.success("Funcionalidad de carga en desarrollo");
  };

  const handleShare = (materialId: string) => {
    toast.success("Material compartido con paciente");
  };

  const handleDownload = (materialId: string) => {
    toast.success("Descargando material...");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Biblioteca</h1>
          <p className="text-muted-foreground mt-1">
            Materiales y recursos terapéuticos
          </p>
        </div>
        <Button onClick={handleUpload}>
          <Upload className="w-4 h-4 mr-2" />
          Subir material
        </Button>
      </div>

      {/* Lista de materiales */}
      <div className="grid gap-4">
        {mockLibraryMaterials.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No tienes materiales en tu biblioteca
              </p>
              <Button onClick={handleUpload} variant="outline" className="mt-4">
                Subir primer material
              </Button>
            </CardContent>
          </Card>
        ) : (
          mockLibraryMaterials.map((material) => (
            <Card key={material.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{material.title}</CardTitle>
                    <p className="text-muted-foreground mt-1">
                      Subido el{" "}
                      {new Date(material.uploadDate).toLocaleDateString("es-MX")}
                    </p>
                  </div>
                  <Badge variant="outline">{material.type.toUpperCase()}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {material.sharedWith.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Compartido con:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {material.sharedWith.map((patientId) => {
                          const patient = mockPatients.find(
                            (p) => p.id === patientId
                          );
                          return (
                            <Badge key={patientId} variant="secondary">
                              {patient?.name}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleShare(material.id)}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Compartir con paciente
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownload(material.id)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Descargar
                    </Button>
                    <Button size="sm" variant="ghost">
                      Editar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
