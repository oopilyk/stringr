/**
 * Update Quote API Endpoint
 *
 * Allows stringer to update the quote price before payment is authorized.
 *
 * Security:
 * - Only the assigned stringer can update the quote
 * - Can only update requests in 'accepted' status (before payment authorization)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { z } from 'zod'

const UpdateQuoteSchema = z.object({
  final_price_cents: z.number().int().min(100, 'Price must be at least $1').max(1000000, 'Price too high')
}).strict()

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()

    // 1. AUTHENTICATION
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // 2. VALIDATE REQUEST ID
    const requestId = params.id
    if (!requestId || typeof requestId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request ID' },
        { status: 400 }
      )
    }

    // 3. PARSE AND VALIDATE BODY
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    const validation = UpdateQuoteSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.format() },
        { status: 400 }
      )
    }

    const { final_price_cents } = validation.data

    // 4. FETCH REQUEST AND VERIFY OWNERSHIP
    const { data: req, error: fetchError } = await supabase
      .from('requests')
      .select('id, status, stringer_id, payment_intent_id, payment_authorized_at')
      .eq('id', requestId)
      .single()

    if (fetchError || !req) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    // 5. AUTHORIZATION - Only assigned stringer can update
    if (req.stringer_id !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to update this request' },
        { status: 403 }
      )
    }

    // 6. STATUS CHECK - Can only update accepted requests before payment
    if (req.status !== 'accepted') {
      return NextResponse.json(
        { error: 'Can only update quote for accepted requests' },
        { status: 400 }
      )
    }

    // 7. PAYMENT CHECK - Cannot update after payment is authorized
    if (req.payment_intent_id || req.payment_authorized_at) {
      return NextResponse.json(
        { error: 'Cannot update quote after payment has been authorized' },
        { status: 400 }
      )
    }

    // 8. UPDATE THE QUOTE
    const { error: updateError } = await supabase
      .from('requests')
      .update({
        final_price_cents,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)

    if (updateError) {
      console.error('Failed to update quote:', updateError)
      return NextResponse.json(
        { error: 'Failed to update quote' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      final_price_cents
    })

  } catch (error: any) {
    console.error('Update quote error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
