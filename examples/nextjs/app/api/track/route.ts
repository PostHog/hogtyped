import { NextRequest, NextResponse } from 'next/server';
// Server-side usage of the generated wrapper
import { posthog } from '@/lib/posthog';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, properties, distinctId } = body;

    // Validate the event against schema (happens automatically!)
    // The generated wrapper has all schemas embedded
    posthog.capture(event, {
      ...properties,
      distinct_id: distinctId || 'anonymous',
      source: 'api'
    });

    return NextResponse.json({
      success: true,
      message: 'Event tracked successfully'
    });
  } catch (error) {
    // Schema validation errors are caught here
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Invalid event'
      },
      { status: 400 }
    );
  }
}

// Example endpoint to get available events (for documentation)
export async function GET() {
  // The generated wrapper knows all available events
  return NextResponse.json({
    availableEvents: [
      'user_signed_up',
      'button_clicked',
      'page_viewed',
      'form_submitted'
    ],
    message: 'Use POST to track events with these names'
  });
}