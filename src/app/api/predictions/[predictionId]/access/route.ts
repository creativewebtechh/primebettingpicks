export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(
  _request: Request,
  props: { params: Promise<{ predictionId: string }> }
) {
  const { predictionId } = await props.params

  try {
    const prediction = await prisma.prediction.findUnique({
      where: { id: predictionId },
      include: { match: true },
    })

    if (!prediction) {
      return NextResponse.json({ error: 'Prediction not found' }, { status: 404 })
    }

    if (!prediction.premium) {
      return NextResponse.json({ hasAccess: true, prediction })
    }

    const session = await getSession()

    if (!session) {
      return NextResponse.json({
        hasAccess: false,
        prediction: { ...prediction, analysis: null, bettingTips: null, notes: null },
      })
    }

    if (session.role === 'admin' || session.role === 'superadmin') {
      return NextResponse.json({ hasAccess: true, prediction })
    }

    const payment = await prisma.payment.findFirst({
      where: {
        userId: session.userId,
        predictionId,
        status: 'success',
      },
    })

    if (payment) {
      return NextResponse.json({ hasAccess: true, prediction })
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.userId,
        status: 'active',
        currentPeriodEnd: { gte: new Date() },
      },
    })

    if (subscription) {
      return NextResponse.json({ hasAccess: true, prediction })
    }

    return NextResponse.json({
      hasAccess: false,
      prediction: { ...prediction, analysis: null, bettingTips: null, notes: null },
    })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
