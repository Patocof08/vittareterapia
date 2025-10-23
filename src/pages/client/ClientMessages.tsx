import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface PsychologistInfo {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

export default function ClientMessages() {
  const { user } = useAuth();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [psychologist, setPsychologist] = useState<PsychologistInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (user) {
      loadConversation();
    }
  }, [user]);

  useEffect(() => {
    if (conversationId) {
      loadMessages();
      markMessagesAsRead();
    }
  }, [conversationId]);

  // Realtime subscription
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel('client-messages-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
          
          // Mark as read if message is from psychologist
          if (newMessage.sender_id !== user?.id) {
            markMessagesAsRead();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user]);

  const loadConversation = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Check if user has any appointments (to find their psychologist)
      const { data: appointments } = await supabase
        .from("appointments")
        .select("psychologist_id")
        .eq("patient_id", user.id)
        .limit(1);

      if (!appointments || appointments.length === 0) {
        setLoading(false);
        return;
      }

      const psychologistId = appointments[0].psychologist_id;

      // Get or create conversation
      let { data: convo, error: convoError } = await supabase
        .from("conversations")
        .select("*")
        .eq("client_id", user.id)
        .eq("psychologist_id", psychologistId)
        .maybeSingle();

      if (convoError && convoError.code !== "PGRST116") {
        throw convoError;
      }

      // Create conversation if it doesn't exist
      if (!convo) {
        const { data: newConvo, error: createError } = await supabase
          .from("conversations")
          .insert({
            client_id: user.id,
            psychologist_id: psychologistId
          })
          .select()
          .single();

        if (createError) throw createError;
        convo = newConvo;
      }

      setConversationId(convo.id);

      // Get psychologist profile info
      const { data: psychProfile } = await supabase
        .from("psychologist_profiles")
        .select("id, first_name, last_name, profile_photo_url")
        .eq("id", psychologistId)
        .single();

      if (psychProfile) {
        // Get user_id from psychologist profile
        const { data: userData } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .eq("id", psychProfile.id)
          .maybeSingle();

        // Try to get from psychologist's user_id
        if (!userData) {
          const { data: psychUser } = await supabase
            .from("psychologist_profiles")
            .select("user_id")
            .eq("id", psychologistId)
            .single();

          if (psychUser) {
            const { data: userProfile } = await supabase
              .from("profiles")
              .select("id, full_name, avatar_url")
              .eq("id", psychUser.user_id)
              .single();

            if (userProfile) {
              setPsychologist({
                id: psychologistId,
                full_name: userProfile.full_name || `${psychProfile.first_name} ${psychProfile.last_name}`,
                avatar_url: userProfile.avatar_url || psychProfile.profile_photo_url
              });
            }
          }
        } else {
          setPsychologist({
            id: psychologistId,
            full_name: userData.full_name || `${psychProfile.first_name} ${psychProfile.last_name}`,
            avatar_url: userData.avatar_url || psychProfile.profile_photo_url
          });
        }

        // Fallback
        if (!psychologist) {
          setPsychologist({
            id: psychologistId,
            full_name: `${psychProfile.first_name} ${psychProfile.last_name}`,
            avatar_url: psychProfile.profile_photo_url
          });
        }
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
      toast.error("Error al cargar la conversación");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!conversationId) return;

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error("Error al cargar mensajes");
    }
  };

  const markMessagesAsRead = async () => {
    if (!conversationId || !user) return;

    try {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", user.id)
        .eq("is_read", false);
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !conversationId || !user) {
      toast.error("Escribe un mensaje antes de enviar");
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: messageText.trim(),
          is_read: false
        });

      if (error) throw error;
      setMessageText("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Error al enviar mensaje");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando mensajes...</p>
      </div>
    );
  }

  if (!conversationId || !psychologist) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mensajes</h1>
          <p className="text-muted-foreground mt-1">Chat con tu psicólogo</p>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Aún no tienes un psicólogo asignado
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Agenda tu primera sesión para comenzar
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mensajes</h1>
        <p className="text-muted-foreground mt-1">Chat con tu psicólogo</p>
      </div>

      <Card className="min-h-[600px] flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={psychologist.avatar_url || ""} />
              <AvatarFallback>
                {psychologist.full_name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{psychologist.full_name}</CardTitle>
              <p className="text-sm text-muted-foreground">Tu psicólogo</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Emergency warning */}
          <div className="bg-destructive/10 border-b border-destructive/20 p-4">
            <p className="text-sm text-destructive font-medium">
              ⚠️ Este no es un servicio de emergencias
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Si necesitas ayuda inmediata, contacta a los servicios de emergencia o
              la Línea de la Vida: 800 911 2000
            </p>
          </div>

          {/* Messages area */}
          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50 text-muted-foreground" />
                  <p className="text-muted-foreground">No hay mensajes aún</p>
                  <p className="text-sm mt-1 text-muted-foreground">
                    Inicia una conversación con tu psicólogo
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => {
                  const isClient = message.sender_id === user?.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isClient ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          isClient
                            ? "bg-primary text-primary-foreground"
                            : "bg-accent"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                        <p
                          className={`text-xs mt-1 ${
                            isClient
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {format(new Date(message.created_at), "HH:mm", { locale: es })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input area */}
          <div className="border-t p-4">
            <div className="flex gap-2">
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
                disabled={sending}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} disabled={sending} size="icon">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
