-- Create conversations table to track chat threads between psychologists and clients
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  psychologist_id UUID NOT NULL,
  client_id UUID NOT NULL,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(psychologist_id, client_id)
);

-- Create messages table for individual messages
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
-- Psychologists can view conversations where they are the psychologist
CREATE POLICY "Psychologists can view their own conversations"
ON public.conversations
FOR SELECT
USING (
  psychologist_id IN (
    SELECT id FROM psychologist_profiles
    WHERE user_id = auth.uid() AND has_role(auth.uid(), 'psicologo'::app_role)
  )
);

-- Clients can view conversations where they are the client
CREATE POLICY "Clients can view their own conversations"
ON public.conversations
FOR SELECT
USING (auth.uid() = client_id);

-- Clients can create conversations
CREATE POLICY "Clients can create conversations"
ON public.conversations
FOR INSERT
WITH CHECK (auth.uid() = client_id);

-- Psychologists can create conversations
CREATE POLICY "Psychologists can create conversations"
ON public.conversations
FOR INSERT
WITH CHECK (
  psychologist_id IN (
    SELECT id FROM psychologist_profiles
    WHERE user_id = auth.uid() AND has_role(auth.uid(), 'psicologo'::app_role)
  )
);

-- Update last_message_at automatically
CREATE POLICY "Users can update their own conversations"
ON public.conversations
FOR UPDATE
USING (
  auth.uid() = client_id OR 
  psychologist_id IN (
    SELECT id FROM psychologist_profiles
    WHERE user_id = auth.uid() AND has_role(auth.uid(), 'psicologo'::app_role)
  )
);

-- RLS Policies for messages
-- Users can view messages in their conversations
CREATE POLICY "Users can view messages in their conversations"
ON public.messages
FOR SELECT
USING (
  conversation_id IN (
    SELECT id FROM conversations
    WHERE client_id = auth.uid() OR 
    psychologist_id IN (
      SELECT id FROM psychologist_profiles
      WHERE user_id = auth.uid() AND has_role(auth.uid(), 'psicologo'::app_role)
    )
  )
);

-- Users can send messages in their conversations
CREATE POLICY "Users can send messages in their conversations"
ON public.messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND
  conversation_id IN (
    SELECT id FROM conversations
    WHERE client_id = auth.uid() OR 
    psychologist_id IN (
      SELECT id FROM psychologist_profiles
      WHERE user_id = auth.uid() AND has_role(auth.uid(), 'psicologo'::app_role)
    )
  )
);

-- Users can mark messages as read
CREATE POLICY "Users can update messages in their conversations"
ON public.messages
FOR UPDATE
USING (
  conversation_id IN (
    SELECT id FROM conversations
    WHERE client_id = auth.uid() OR 
    psychologist_id IN (
      SELECT id FROM psychologist_profiles
      WHERE user_id = auth.uid() AND has_role(auth.uid(), 'psicologo'::app_role)
    )
  )
);

-- Create indexes for better performance
CREATE INDEX idx_conversations_psychologist ON conversations(psychologist_id);
CREATE INDEX idx_conversations_client ON conversations(client_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Function to update last_message_at in conversations
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

-- Trigger to update conversation timestamp when a message is created
CREATE TRIGGER update_conversation_on_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();

-- Enable realtime for messages and conversations
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;