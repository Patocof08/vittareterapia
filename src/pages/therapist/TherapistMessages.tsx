import { useState } from "react";
import { MessageSquare, Send, Paperclip, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
// Datos de mensajes/pacientes aún no conectados a la base
import { toast } from "sonner";

export default function TherapistMessages() {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");

  const handleSendMessage = () => {
    if (!messageText.trim()) {
      toast.error("Escribe un mensaje antes de enviar");
      return;
    }
    toast.success("Mensaje enviado");
    setMessageText("");
  };

  // Pacientes con mensajes
  const patientsWithMessages: any[] = [];

  // Mensajes del paciente seleccionado
  const selectedMessages: any[] = [];

  const selectedPatient: any = null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mensajes</h1>
        <p className="text-muted-foreground mt-1">
          Comunícate de forma segura con tus pacientes
        </p>
      </div>

      {/* Aviso de emergencias */}
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">
                No usar para emergencias
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Este sistema de mensajería no está diseñado para crisis o
                emergencias. Para situaciones urgentes, contacta a los servicios
                de emergencia locales o la Línea de la Vida: 800 911 2000.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interfaz de mensajería */}
      <div className="grid lg:grid-cols-3 gap-6 h-[600px]">
        {/* Lista de conversaciones */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Conversaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {patientsWithMessages.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay conversaciones
                </p>
              ) : (
                patientsWithMessages.map((patient) => {
                  const unreadCount = 0;
                  const lastMessageText = "";

                  return (
                    <button
                      key={patient.id}
                      onClick={() => setSelectedPatientId(patient.id)}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        selectedPatientId === patient.id
                          ? "bg-primary/10 border-primary/20"
                          : "hover:bg-accent"
                      } border border-border`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-foreground">
                          {patient.name}
                        </p>
                        {unreadCount > 0 && (
                          <span className="bg-destructive text-destructive-foreground text-xs font-semibold px-2 py-0.5 rounded-full">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {lastMessageText}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chat */}
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader>
            <CardTitle>
              {selectedPatient ? selectedPatient.name : "Selecciona una conversación"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            {!selectedPatientId ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Selecciona una conversación para comenzar
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Mensajes */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {selectedMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender === "therapist" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          message.sender === "therapist"
                            ? "bg-primary text-primary-foreground"
                            : "bg-accent text-accent-foreground"
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.sender === "therapist"
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {new Date(message.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input de mensaje */}
                <div className="border-t border-border pt-4">
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon">
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <Input
                      placeholder="Escribe un mensaje..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button onClick={handleSendMessage}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
