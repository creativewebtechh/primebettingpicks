import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { initializePayment, generateReference } from '@/lib/paystack'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const requestId = crypto.randomUUID().slice(0, 8)

  try {
    const session = await getSession()
    if (!session) {
      logger.warn('Payments.Initialize: unauthorized', { requestId })
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    let body: { predictionId?: string; amount?: number }
    try {
      body = await request.json()
    } catch {
      logger.error('Payments.Initialize: malformed request body', { requestId })
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 })
    }

    const { predictionId, amount } = body

    if (!predictionId || typeof predictionId !== 'string') {
      logger.warn('Payments.Initialize: missing predictionId', { requestId })
      return NextResponse.json({ error: 'predictionId is required' }, { status: 400 })
    }

    const predictionAmount = amount || 0
    if (typeof predictionAmount !== 'number' || predictionAmount <= 0) {
      logger.warn('Payments.Initialize: invalid amount', { requestId })
      return NextResponse.json(
        { error: 'Please provide a valid amount' },
        { status: 400 }
      )
    }

    let prediction
    try {
      prediction = await prisma.prediction.findUnique({
        where: { id: predictionId },
        select: { id: true },
      })
    } catch {
      logger.warn('Payments.Initialize: prediction lookup failed', { requestId })
      return NextResponse.json({ error: 'Unable to verify prediction' }, { status: 503 })
    }

    if (!prediction) {
      logger.warn('Payments.Initialize: prediction not found', { requestId })
      return NextResponse.json({ error: 'Prediction not found' }, { status: 404 })
    }

    let existingPayment: { id: string; status: string } | null = null
    try {
      existingPayment = await prisma.payment.findFirst({
        where: { userId: session.userId, predictionId },
        select: { id: true, status: true },
      })
    } catch {
      // ignore
    }

    if (existingPayment && existingPayment.status === 'success') {
      logger.info('Payments.Initialize: prediction already purchased', { requestId })
      return NextResponse.json({ error: 'Prediction already purchased' }, { status: 409 })
    }

    const reference = generateReference()
    let user
    try {
      user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { email: true, name: true },
      })
    } catch {
      logger.error('Payments.Initialize: user lookup failed', { requestId })
      return NextResponse.json({ error: 'User lookup failed' }, { status: 503 })
    }

    if (!user) {
      logger.warn('Payments.Initialize: user not found', { requestId })
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let paystackResponse
    try {
      paystackResponse = await initializePayment({
        email: user.email,
        amount: predictionAmount,
        reference: reference,
        metadata: {
          user_id: session.userId,
          prediction_id: predictionId,
        },
        callback_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/predictions/${predictionId}`,
      })
    } catch (paystackError) {
      logger.error('Payments.Initialize: Paystack call failed', {
        requestId,
        error: paystackError instanceof Error ? paystackError.message : 'Unknown error',
      })
      return NextResponse.json(
        { error: 'Payment initialization failed. Please try again later.' },
        { status: 502 }
      )
    }

    if (!paystackResponse || !paystackResponse.status) {
      logger.warn('Payments.Initialize: Paystack returned error', {
        requestId,
        message: paystackResponse ? paystackResponse.message : 'Empty response',
      })
      return NextResponse.json(
        { error: 'Payment service temporarily unavailable' },
        { status: 502 }
      )
    }

    try {
      await prisma.payment.create({
        data: {
          userId: session.userId,
          predictionId: predictionId,
          amount: predictionAmount,
          reference: reference,
          status: 'pending',
        },
      })
    } catch (dbError) {
      logger.error('Payments.Initialize: failed to save payment record', {
        requestId,
        error: dbError instanceof Error ? dbError.message : 'Unknown error',
      })
    }

    logger.info('Payments.Initialize: payment initialized', {
      requestId,
      userId: session.userId,
      reference,
    })

    return NextResponse.json({
      authorization_url: paystackResponse.data.authorization_url,
      reference: reference,
    })
  } catch (error) {
    logger.error('Payments.Initialize: unhandled error', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    )
  }
}
