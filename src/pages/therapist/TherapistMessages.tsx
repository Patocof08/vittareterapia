import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, AlertCircle } from "lucide-react";
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

interface Conversation {
  id: string;
  psychologist_id: string;
  client_id: string;
  last_message_at: string;
  client_name: string;
  client_avatar: string | null;
  unread_count: number;
  last_message?: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export default function TherapistMessages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [psychologistId, setPsychologistId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (user) {
      loadPsychologistProfile();
    }
  }, [user]);

  useEffect(() => {
    if (psychologistId) {
      loadConversations();
    }
  }, [psychologistId]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      markMessagesAsRead(selectedConversation.id);
    }
  }, [selectedConversation]);

  // Realtime subscription for new messages
  useEffect(() => {
    if (!selectedConversation) return;

    const channel = supabase
      .channel('messages-channel')
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
          
          // Mark as read if we're viewing the conversation
          if (newMessage.sender_id !== user?.id) {
            markMessagesAsRead(selectedConversation.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation, user]);

  const loadPsychologistProfile = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from("psychologist_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (profile) {
      setPsychologistId(profile.id);
    }
  };

  const loadConversations = async () => {
    if (!psychologistId) return;

    try {
      setLoading(true);

      // Get all patients (from appointments)
      const { data: appointments } = await supabase
        .from("appointments")
        .select("patient_id")
        .eq("psychologist_id", psychologistId);

      if (!appointments || appointments.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Get unique patient IDs
      const patientIds = [...new Set(appointments.map(a => a.patient_id))];

      // Get or create conversations for each patient
      const conversationsData = await Promise.all(
        patientIds.map(async (patientId) => {
          // Check if conversation exists
          let { data: convo } = await supabase
            .from("conversations")
            .select("*")
            .eq("psychologist_id", psychologistId)
            .eq("client_id", patientId)
            .maybeSingle();

          // Create conversation if it doesn't exist
          if (!convo) {
            const { data: newConvo, error: createError } = await supabase
              .from("conversations")
              .insert({
                psychologist_id: psychologistId,
                client_id: patientId
              })
              .select()
              .single();

            if (createError) {
              console.error("Error creating conversation:", createError);
              return null;
            }
            convo = newConvo;
          }

          // Get patient profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url")
            .eq("id", patientId)
            .single();

          // Get unread count
          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", convo.id)
            .eq("is_read", false)
            .neq("sender_id", user!.id);

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
            client_name: profile?.full_name || "Cliente",
            client_avatar: profile?.avatar_url || null,
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
    } catch (error) {
      console.error("Error loading conversations:", error);
      toast.error("Error al cargar conversaciones");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
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

  const markMessagesAsRead = async (conversationId: string) => {
    if (!user) return;

    try {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", user.id)
        .eq("is_read", false);

      // Update local unread count
      setConversations(prev =>
        prev.map(c =>
          c.id === conversationId ? { ...c, unread_count: 0 } : c
        )
      );
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
      // No need to reload conversations - realtime subscription will handle it
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
        <p className="text-muted-foreground">Cargando conversaciones...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mensajes</h1>
        <p className="text-muted-foreground mt-1">
          Comunícate de forma segura con tus pacientes
        </p>
      </div>

      {/* Emergency warning */}
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

      {/* Messaging interface */}
      <div className="grid lg:grid-cols-3 gap-6 h-[600px]">
        {/* Conversations list */}
        <Card className="lg:col-span-1 flex flex-col">
          <CardHeader>
            <CardTitle>Conversaciones</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-2 pr-4">
                {conversations.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No hay conversaciones
                  </p>
                ) : (
                  conversations.map((convo) => (
                    <button
                      key={convo.id}
                      onClick={() => setSelectedConversation(convo)}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        selectedConversation?.id === convo.id
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-accent"
                      } border`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={convo.client_avatar || ""} />
                          <AvatarFallback>
                            {convo.client_name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-foreground truncate">
                              {convo.client_name}
                            </p>
                            {convo.unread_count > 0 && (
                              <span className="bg-primary text-primary-foreground text-xs font-semibold px-2 py-0.5 rounded-full ml-2">
                                {convo.unread_count}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1 pl-[52px]">
                        {convo.last_message || "No hay mensajes"}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat area */}
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-3">
              {selectedConversation ? (
                <>
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={selectedConversation.client_avatar || ""} />
                    <AvatarFallback>
                      {selectedConversation.client_name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {selectedConversation.client_name}
                </>
              ) : (
                "Selecciona una conversación"
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            {!selectedConversation ? (
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
                {/* Messages */}
                <div className="flex-1 overflow-hidden">
                  <ScrollArea className="h-full p-4">
                    <div className="space-y-4">
                      {messages.map((message) => {
                        const isTherapist = message.sender_id === user?.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isTherapist ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[70%] p-3 rounded-lg ${
                                isTherapist
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-accent"
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                              <p
                                className={`text-xs mt-1 ${
                                  isTherapist
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
                  </ScrollArea>
                </div>

                {/* Message input */}
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
                    />
                    <Button onClick={handleSendMessage} disabled={sending}>
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
