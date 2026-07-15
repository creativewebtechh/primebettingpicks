import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET() {
  const requestId = crypto.randomUUID().slice(0, 8)

  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    let payments
    try {
      payments = await prisma.payment.findMany({
        where: { userId: session.userId },
        select: {
          id: true,
          predictionId: true,
          amount: true,
          currency: true,
          reference: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      })
    } catch (dbError) {
      logger.error('Payments.List: DB error', {
        requestId,
        error: dbError instanceof Error ? dbError.message : 'Unknown error',
      })
      return NextResponse.json({ error: 'Failed to load payments' }, { status: 503 })
    }

    return NextResponse.json({ payments })
  } catch (error) {
    logger.error('Payments.List: unhandled error', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
