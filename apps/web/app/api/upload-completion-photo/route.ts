import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { createClient as createServerClient } from '@supabase/supabase-js'

// This endpoint allows photo uploads without authentication (via unique token)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const token = formData.get('token') as string

    if (!file || !token) {
      return NextResponse.json(
        { error: 'File and token are required' },
        { status: 400 }
      )
    }

    // Extract request ID from token (format: requestId-timestamp)
    const requestId = token.split('-')[0]

    // Create a server client with service role to bypass RLS
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify request exists
    const { data: requestData, error: requestError } = await supabase
      .from('requests')
      .select('id')
      .eq('id', requestId)
      .single()

    if (requestError || !requestData) {
      return NextResponse.json(
        { error: 'Invalid request ID' },
        { status: 400 }
      )
    }

    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${requestId}-completion-${Date.now()}.${fileExt}`
    const filePath = `completion-photos/${fileName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('stringing-photos')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('stringing-photos')
      .getPublicUrl(filePath)

    const photoUrl = urlData.publicUrl

    // Get request details for gallery entry
    const { data: requestDetails, error: requestDetailsError } = await supabase
      .from('requests')
      .select(`
        stringer_id,
        string_selection,
        tension_mains_lbs,
        tension_crosses_lbs
      `)
      .eq('id', requestId)
      .single()

    if (requestDetailsError) {
      console.error('Error fetching request details:', requestDetailsError)
    }

    // Find or create completion_photo task
    const { data: existingTask } = await supabase
      .from('stringing_tasks')
      .select('id')
      .eq('request_id', requestId)
      .eq('task_type', 'completion_photo')
      .single()

    if (existingTask) {
      // Update existing task
      await supabase
        .from('stringing_tasks')
        .update({
          photo_url: photoUrl,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', existingTask.id)
    } else {
      // Create new task
      await supabase
        .from('stringing_tasks')
        .insert({
          request_id: requestId,
          task_type: 'completion_photo',
          status: 'completed',
          photo_url: photoUrl,
          completed_at: new Date().toISOString(),
        })
    }

    // Add to racket gallery if we have request details
    if (requestDetails) {
      try {
        // Get current gallery count for display_order
        const { count } = await supabase
          .from('racket_gallery')
          .select('*', { count: 'exact', head: true })
          .eq('stringer_id', requestDetails.stringer_id)

        // Prepare string information
        const stringSelection = requestDetails.string_selection as any
        const stringInfo = stringSelection?.brand && stringSelection?.brand !== 'Player Provided'
          ? `${stringSelection.brand} ${stringSelection.model || ''} ${stringSelection.gauge || ''}`.trim()
          : null

        // Calculate average tension
        const avgTension = requestDetails.tension_mains_lbs && requestDetails.tension_crosses_lbs
          ? (requestDetails.tension_mains_lbs + requestDetails.tension_crosses_lbs) / 2
          : null

        // Generate caption with stringing details
        let caption = 'Completed stringing job'
        if (stringSelection?.brand === 'Player Provided') {
          caption += ' - Player provided string'
        } else if (stringInfo) {
          caption += ` - ${stringInfo}`
        }
        if (avgTension) {
          caption += ` @ ${avgTension} lbs`
        }
        caption += ` (${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})`

        // Insert into racket gallery
        await supabase
          .from('racket_gallery')
          .insert({
            stringer_id: requestDetails.stringer_id,
            image_url: photoUrl,
            caption: caption,
            string_used: stringInfo,
            tension_lbs: avgTension,
            display_order: count || 0,
          })

        console.log('Successfully added completion photo to racket gallery')
      } catch (galleryError) {
        console.error('Error adding to racket gallery:', galleryError)
        // Don't fail the upload if gallery addition fails
      }
    }

    return NextResponse.json({
      success: true,
      photoUrl,
    })
  } catch (error) {
    console.error('Error in upload-completion-photo:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
