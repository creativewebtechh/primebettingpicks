import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { sendTelegramMessage } from '@/lib/telegram'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    await requireAdmin()

    const message = [
      '✅ <b>Telegram Integration Test</b>',
      'Bot is connected to PrimeBettingPicks admin.',
      `Time: ${new Date().toLocaleString()}`,
    ].join('\n')

    const success = await sendTelegramMessage(message)

    return NextResponse.json({
      success,
      message: success ? 'Test message sent successfully' : 'Failed to send test message',
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
