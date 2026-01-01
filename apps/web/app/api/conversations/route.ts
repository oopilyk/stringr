import { createServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// GET /api/conversations - Get all conversations for the current user
export async function GET() {
  try {
    const supabase = createServerClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch conversations where user is a participant
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        id,
        participant_one_id,
        participant_two_id,
        created_at,
        updated_at
      `)
      .or(`participant_one_id.eq.${user.id},participant_two_id.eq.${user.id}`)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching conversations:', error)
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
    }

    // Get the other participant's profile for each conversation
    const conversationsWithProfiles = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId = conv.participant_one_id === user.id
          ? conv.participant_two_id
          : conv.participant_one_id

        // Fetch other user's profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', otherUserId)
          .single()

        // Fetch last message
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('body, created_at, sender_id')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        // Count unread messages (messages sent by the other user after user's last read)
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('sender_id', otherUserId)
          // TODO: Add last_read_at tracking for more accurate unread counts

        return {
          id: conv.id,
          otherUser: profile,
          lastMessage: lastMessage?.body || 'No messages yet',
          lastMessageTime: lastMessage?.created_at,
          unreadCount: unreadCount || 0,
          updatedAt: conv.updated_at
        }
      })
    )

    return NextResponse.json({ conversations: conversationsWithProfiles })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/conversations - Create or get a conversation with another user
export async function POST(request: Request) {
  try {
    const supabase = createServerClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { otherUserId } = await request.json()

    if (!otherUserId) {
      return NextResponse.json({ error: 'otherUserId is required' }, { status: 400 })
    }

    // Use the helper function to get or create conversation
    const { data, error } = await supabase
      .rpc('get_or_create_conversation', {
        user_one_id: user.id,
        user_two_id: otherUserId
      })

    if (error) {
      console.error('Error creating conversation:', error)
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
    }

    return NextResponse.json({ conversationId: data })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
