import { MessageSquare, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ClientMessages() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Mensajes
        </h1>
        <p className="text-muted-foreground mt-1">
          Chat con tu psicólogo
        </p>
      </div>

      <Card className="min-h-[500px] flex flex-col">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Conversación
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-4">
          {/* Mensaje de emergencia */}
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
            <p className="text-sm text-destructive font-medium">
              ⚠️ Este no es un servicio de emergencias
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Si necesitas ayuda inmediata, contacta a los servicios de emergencia
            </p>
          </div>

          {/* Área de mensajes */}
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay mensajes aún</p>
              <p className="text-sm mt-1">Inicia una conversación con tu psicólogo</p>
            </div>
          </div>

          {/* Input de mensaje */}
          <div className="flex gap-2 mt-4">
            <Input 
              placeholder="Escribe un mensaje..." 
              className="flex-1"
            />
            <Button size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
