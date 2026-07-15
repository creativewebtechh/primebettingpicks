import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { sendTelegramMessage, formatAdminBroadcast } from '@/lib/telegram'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { message } = body

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'A non-empty message string is required' },
        { status: 400 }
      )
    }

    if (message.length > 4096) {
      return NextResponse.json(
        { error: 'Message must be 4096 characters or fewer' },
        { status: 400 }
      )
    }

    const success = await sendTelegramMessage(formatAdminBroadcast(message.trim()))

    return NextResponse.json({
      success,
      message: success ? 'Broadcast sent successfully' : 'Failed to send broadcast',
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
