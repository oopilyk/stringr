/**
 * User Reports API
 *
 * Allows users to report other users for violations
 */

import { createServerClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit, RATE_LIMITS } from '@/lib/security/rate-limit'
import { z } from 'zod'

const ReportSchema = z.object({
  reported_user_id: z.string().uuid('Invalid user ID'),
  request_id: z.string().uuid('Invalid request ID').optional().nullable(),
  reason: z.enum([
    'inappropriate_behavior',
    'no_show',
    'scam_fraud',
    'harassment',
    'quality_issues',
    'communication_issues',
    'other'
  ]),
  description: z.string()
    .min(20, 'Please provide more details (at least 20 characters)')
    .max(2000, 'Description too long (max 2000 characters)')
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // 1. Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // 2. Rate limiting (max 5 reports per hour)
    const rateLimitResult = await withRateLimit(request, {
      maxRequests: 5,
      windowMs: 60 * 60 * 1000 // 1 hour
    }, user.id)
    if (rateLimitResult) return rateLimitResult

    // 3. Parse and validate request body
    const body = await request.json()
    const validation = ReportSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { reported_user_id, request_id, reason, description } = validation.data

    // 4. Prevent self-reporting
    if (reported_user_id === user.id) {
      return NextResponse.json(
        { error: 'You cannot report yourself' },
        { status: 400 }
      )
    }

    // 5. Verify reported user exists
    const { data: reportedUser, error: userError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', reported_user_id)
      .single()

    if (userError || !reportedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // 6. If request_id provided, verify reporter was involved in the request
    if (request_id) {
      const { data: req, error: reqError } = await supabase
        .from('requests')
        .select('id, player_id, stringer_id')
        .eq('id', request_id)
        .single()

      if (reqError || !req) {
        return NextResponse.json(
          { error: 'Request not found' },
          { status: 404 }
        )
      }

      // Reporter must be player or stringer on this request
      if (req.player_id !== user.id && req.stringer_id !== user.id) {
        return NextResponse.json(
          { error: 'You are not involved in this request' },
          { status: 403 }
        )
      }

      // Reported user must also be involved
      if (req.player_id !== reported_user_id && req.stringer_id !== reported_user_id) {
        return NextResponse.json(
          { error: 'Reported user is not involved in this request' },
          { status: 400 }
        )
      }
    }

    // 7. Check for duplicate reports (same reporter, same user, pending status)
    const { data: existingReport } = await supabase
      .from('user_reports')
      .select('id')
      .eq('reporter_id', user.id)
      .eq('reported_user_id', reported_user_id)
      .eq('status', 'pending')
      .single()

    if (existingReport) {
      return NextResponse.json(
        { error: 'You already have a pending report for this user' },
        { status: 409 }
      )
    }

    // 8. Create the report
    const { data: report, error: insertError } = await supabase
      .from('user_reports')
      .insert({
        reporter_id: user.id,
        reported_user_id,
        request_id: request_id || null,
        reason,
        description: description.trim()
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating report:', insertError)
      return NextResponse.json(
        { error: 'Failed to submit report' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Report submitted successfully. Our team will review it shortly.',
      report_id: report.id
    })

  } catch (error: any) {
    console.error('Report submission error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
