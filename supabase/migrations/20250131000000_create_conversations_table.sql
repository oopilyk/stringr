-- Create conversations table for direct messaging between users
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_one_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant_two_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  -- Ensure participants are unique (prevent duplicate conversations)
  CONSTRAINT unique_participants UNIQUE (participant_one_id, participant_two_id),
  -- Ensure participants are different users
  CONSTRAINT different_participants CHECK (participant_one_id != participant_two_id)
);

-- Create index for faster lookups
CREATE INDEX conversations_participant_one_idx ON public.conversations(participant_one_id);
CREATE INDEX conversations_participant_two_idx ON public.conversations(participant_two_id);
CREATE INDEX conversations_updated_at_idx ON public.conversations(updated_at DESC);

-- Update messages table to support both request-based and direct messaging
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  ALTER COLUMN request_id DROP NOT NULL;

-- Add index for conversation messages
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON public.messages(conversation_id);

-- Add check constraint to ensure message is either for a request OR conversation
ALTER TABLE public.messages
  ADD CONSTRAINT message_belongs_to_request_or_conversation
  CHECK (
    (request_id IS NOT NULL AND conversation_id IS NULL) OR
    (request_id IS NULL AND conversation_id IS NOT NULL)
  );

-- Enable RLS on conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see conversations they're part of
CREATE POLICY "Users can view their own conversations"
  ON public.conversations
  FOR SELECT
  USING (
    auth.uid() = participant_one_id OR
    auth.uid() = participant_two_id
  );

-- Policy: Users can create conversations
CREATE POLICY "Users can create conversations"
  ON public.conversations
  FOR INSERT
  WITH CHECK (
    auth.uid() = participant_one_id OR
    auth.uid() = participant_two_id
  );

-- Update messages RLS policies to handle both request and conversation messages
DROP POLICY IF EXISTS "Users can view messages for their requests" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages for their requests" ON public.messages;

-- Policy: Users can view messages they're involved in
CREATE POLICY "Users can view their messages"
  ON public.messages
  FOR SELECT
  USING (
    -- For request messages
    (request_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM requests
      WHERE requests.id = messages.request_id
      AND (requests.player_id = auth.uid() OR requests.stringer_id = auth.uid())
    ))
    OR
    -- For conversation messages
    (conversation_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.participant_one_id = auth.uid() OR conversations.participant_two_id = auth.uid())
    ))
  );

-- Policy: Users can send messages to their conversations or requests
CREATE POLICY "Users can send messages"
  ON public.messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND (
      -- For request messages
      (request_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM requests
        WHERE requests.id = messages.request_id
        AND (requests.player_id = auth.uid() OR requests.stringer_id = auth.uid())
      ))
      OR
      -- For conversation messages
      (conversation_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM conversations
        WHERE conversations.id = messages.conversation_id
        AND (conversations.participant_one_id = auth.uid() OR conversations.participant_two_id = auth.uid())
      ))
    )
  );

-- Function to update conversation's updated_at timestamp when a message is sent
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.conversation_id IS NOT NULL THEN
    UPDATE conversations
    SET updated_at = NEW.created_at
    WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update conversation timestamp
CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- Helper function to get or create a conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_conversation(user_one_id uuid, user_two_id uuid)
RETURNS uuid AS $$
DECLARE
  conv_id uuid;
  smaller_id uuid;
  larger_id uuid;
BEGIN
  -- Normalize the order of participants (smaller UUID first)
  IF user_one_id < user_two_id THEN
    smaller_id := user_one_id;
    larger_id := user_two_id;
  ELSE
    smaller_id := user_two_id;
    larger_id := user_one_id;
  END IF;

  -- Try to find existing conversation
  SELECT id INTO conv_id
  FROM conversations
  WHERE (participant_one_id = smaller_id AND participant_two_id = larger_id)
     OR (participant_one_id = larger_id AND participant_two_id = smaller_id);

  -- If not found, create new conversation
  IF conv_id IS NULL THEN
    INSERT INTO conversations (participant_one_id, participant_two_id)
    VALUES (smaller_id, larger_id)
    RETURNING id INTO conv_id;
  END IF;

  RETURN conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
