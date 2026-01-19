import { createServerClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit, RATE_LIMITS } from '@/lib/security/rate-limit'
import { validateData, MessageSchema, ConversationIdParamSchema } from '@/lib/validation/schemas'

/**
 * GET /api/conversations/[id]/messages - Get all messages for a conversation
 *
 * SECURITY:
 * - Rate limited to 100 req/min (read operations)
 * - UUID validation on path parameters
 * - Authentication required
 * - Authorization: only participants can read messages
 * - Database error sanitization
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()

    // 1. AUTHENTICATION - Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // 2. RATE LIMITING - Prevent abuse (100 req/min for reads)
    const rateLimitResult = await withRateLimit(request, RATE_LIMITS.READ, user.id)
    if (rateLimitResult) return rateLimitResult

    // 3. INPUT VALIDATION - Validate path parameters
    const paramsValidation = validateData(ConversationIdParamSchema, params)
    if (!paramsValidation.success) {
      return NextResponse.json(
        { error: 'Invalid conversation ID format' },
        { status: 400 }
      )
    }

    const conversationId = params.id

    // 4. AUTHORIZATION - Verify user is participant in this conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('participant_one_id, participant_two_id')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      console.error('[Get Messages] Conversation not found:', conversationId)
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      )
    }

    if (conversation.participant_one_id !== user.id && conversation.participant_two_id !== user.id) {
      console.error('[Get Messages] Unauthorized access attempt:', { conversationId, userId: user.id })
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // 5. DATABASE OPERATION - Fetch messages
    const { data: messages, error } = await supabase
      .from('messages')
      .select('id, body, sender_id, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[Get Messages] Database query failed:', error.message)
      // SECURITY: Don't expose database details
      return NextResponse.json(
        { error: 'Failed to fetch messages. Please try again.' },
        { status: 500 }
      )
    }

    // 6. TRANSFORM - Add fromMe flag for UI
    const transformedMessages = messages.map((msg) => ({
      id: msg.id,
      body: msg.body,
      fromMe: msg.sender_id === user.id,
      senderId: msg.sender_id,
      createdAt: msg.created_at
    }))

    // 7. SUCCESS RESPONSE
    return NextResponse.json({ messages: transformedMessages })

  } catch (error: any) {
    // SECURITY: Global error handler - sanitize all errors
    console.error('[Get Messages] Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/conversations/[id]/messages - Send a message to a conversation
 *
 * SECURITY:
 * - Rate limited to 30 req/min (prevents message spam)
 * - UUID validation on path parameters
 * - Strict input validation (max 5000 chars, prevents XSS)
 * - Authentication required
 * - Authorization: only participants can send messages
 * - Message trimming to prevent whitespace spam
 * - Database error sanitization
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()

    // 1. AUTHENTICATION - Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // 2. RATE LIMITING - Prevent message spam (30 req/min)
    const rateLimitResult = await withRateLimit(request, RATE_LIMITS.MUTATION, user.id)
    if (rateLimitResult) return rateLimitResult

    // 3. INPUT VALIDATION - Validate path parameters
    const paramsValidation = validateData(ConversationIdParamSchema, params)
    if (!paramsValidation.success) {
      return NextResponse.json(
        { error: 'Invalid conversation ID format' },
        { status: 400 }
      )
    }

    const conversationId = params.id

    // 4. INPUT VALIDATION - Validate message body
    const requestBody = await request.json()
    const validation = validateData(MessageSchema, requestBody)
    if (!validation.success) {
      console.error('[Send Message] Validation failed:', validation.error)
      return NextResponse.json(
        { error: 'Invalid message', details: validation.error },
        { status: 400 }
      )
    }

    const { body } = validation.data

    // 5. AUTHORIZATION - Verify user is participant in this conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('participant_one_id, participant_two_id')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      console.error('[Send Message] Conversation not found:', conversationId)
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      )
    }

    if (conversation.participant_one_id !== user.id && conversation.participant_two_id !== user.id) {
      console.error('[Send Message] Unauthorized access attempt:', { conversationId, userId: user.id })
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // 6. DATABASE OPERATION - Insert message
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        body: body
      })
      .select('id, body, sender_id, created_at')
      .single()

    if (error) {
      console.error('[Send Message] Database insert failed:', error.message)
      // SECURITY: Don't expose database details
      return NextResponse.json(
        { error: 'Failed to send message. Please try again.' },
        { status: 500 }
      )
    }

    // 7. SUCCESS RESPONSE
    console.log(`[Send Message] Success: Message sent in conversation ${conversationId} by user ${user.id}`)
    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        body: message.body,
        fromMe: true,
        senderId: message.sender_id,
        createdAt: message.created_at
      }
    })

  } catch (error: any) {
    // SECURITY: Global error handler - sanitize all errors
    console.error('[Send Message] Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
