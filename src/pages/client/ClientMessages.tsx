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

interface Conversation {
  id: string;
  psychologist_id: string;
  client_id: string;
  last_message_at: string;
  psychologist_name: string;
  psychologist_avatar: string | null;
  unread_count: number;
  last_message: string;
}

export default function ClientMessages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
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
      loadConversations();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages();
      markMessagesAsRead();
    }
  }, [selectedConversation]);

  // Realtime subscription
  useEffect(() => {
    if (!selectedConversation) return;

    const channel = supabase
      .channel('client-messages-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation.id}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
          
          // Update conversation list with new message
          setConversations(prev =>
            prev.map(c =>
              c.id === selectedConversation.id
                ? { ...c, last_message: newMessage.content, last_message_at: newMessage.created_at }
                : c
            ).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
          );
          
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
  }, [selectedConversation, user]);

  const loadConversations = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get all psychologists (from appointments)
      const { data: appointments } = await supabase
        .from("appointments")
        .select("psychologist_id")
        .eq("patient_id", user.id);

      if (!appointments || appointments.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Get unique psychologist IDs
      const psychologistIds = [...new Set(appointments.map(a => a.psychologist_id))];

      // Get or create conversations for each psychologist
      const conversationsData = await Promise.all(
        psychologistIds.map(async (psychologistId) => {
          // Check if conversation exists
          let { data: convo } = await supabase
            .from("conversations")
            .select("*")
            .eq("client_id", user.id)
            .eq("psychologist_id", psychologistId)
            .maybeSingle();

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

            if (createError) {
              console.error("Error creating conversation:", createError);
              return null;
            }
            convo = newConvo;
          }

          // Get psychologist profile
          const { data: psychProfile } = await supabase
            .from("psychologist_profiles")
            .select("id, first_name, last_name, profile_photo_url")
            .eq("id", psychologistId)
            .maybeSingle();

          const psychName = psychProfile 
            ? `${psychProfile.first_name} ${psychProfile.last_name}`
            : "Psicólogo";

          // Get unread count
          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", convo.id)
            .neq("sender_id", user.id)
            .eq("is_read", false);

          // Get last message
          const { data: lastMsg } = await supabase
            .from("messages")
            .select("content")
            .eq("conversation_id", convo.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...convo,
            psychologist_name: psychName,
            psychologist_avatar: psychProfile?.profile_photo_url || null,
            unread_count: count || 0,
            last_message: lastMsg?.content || "Inicia la conversación"
          };
        })
      );

      // Filter out nulls and sort by last message
      const validConversations = conversationsData
        .filter(c => c !== null)
        .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());

      setConversations(validConversations);
      
      // Auto-select first conversation if none selected
      if (validConversations.length > 0 && !selectedConversation) {
        setSelectedConversation(validConversations[0]);
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
      toast.error("Error al cargar conversaciones");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!selectedConversation) return;

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", selectedConversation.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error("Error al cargar mensajes");
    }
  };

  const markMessagesAsRead = async () => {
    if (!selectedConversation || !user) return;

    try {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", selectedConversation.id)
        .neq("sender_id", user.id)
        .eq("is_read", false);
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || !user) {
      toast.error("Escribe un mensaje antes de enviar");
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          conversation_id: selectedConversation.id,
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

  if (conversations.length === 0 && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mensajes</h1>
          <p className="text-muted-foreground mt-1">Chat con tus psicólogos</p>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Aún no tienes psicólogos asignados
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
        <p className="text-muted-foreground mt-1">Chat con tus psicólogos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Conversations list */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Conversaciones</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              {conversations.map((convo) => (
                <button
                  key={convo.id}
                  onClick={() => setSelectedConversation(convo)}
                  className={`w-full p-4 flex items-start gap-3 hover:bg-accent transition-colors ${
                    selectedConversation?.id === convo.id ? "bg-accent" : ""
                  }`}
                >
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarImage src={convo.psychologist_avatar || ""} />
                    <AvatarFallback>
                      {convo.psychologist_name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold truncate">{convo.psychologist_name}</p>
                      {convo.unread_count > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5 flex-shrink-0">
                          {convo.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {convo.last_message}
                    </p>
                  </div>
                </button>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat area */}
        <Card className="md:col-span-2 min-h-[600px] flex flex-col">
          {selectedConversation ? (
            <>
              <CardHeader className="border-b">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedConversation.psychologist_avatar || ""} />
                    <AvatarFallback>
                      {selectedConversation.psychologist_name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{selectedConversation.psychologist_name}</CardTitle>
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
                <div className="flex-1 overflow-hidden">
                  <ScrollArea className="h-full p-4">
                    {messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full min-h-[300px]">
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
                </div>

                {/* Input area */}
                <div className="border-t p-4 flex-shrink-0">
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
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Selecciona una conversación para comenzar</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
