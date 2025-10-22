import { BookOpen, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TherapistLibrary() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Biblioteca</h1>
          <p className="text-muted-foreground mt-1">
            Materiales y recursos terapéuticos
          </p>
        </div>
          <Button>
            <Upload className="w-4 h-4 mr-2" />
            Subir material
          </Button>
      </div>

      {/* Lista de materiales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Materiales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              No hay materiales en tu biblioteca todavía
            </p>
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              Subir material
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
