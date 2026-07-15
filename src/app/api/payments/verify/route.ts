import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { verifyPayment } from '@/lib/paystack'
import { sendTelegramMessage, formatPaymentNotification } from '@/lib/telegram'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestId = crypto.randomUUID().slice(0, 8)

  try {
    const session = await getSession()
    if (!session) {
      logger.warn('Payments.Verify: unauthorized', { requestId })
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reference = searchParams.get('reference')

    if (!reference || typeof reference !== 'string') {
      logger.warn('Payments.Verify: missing reference', { requestId })
      return NextResponse.json({ error: 'Reference is required' }, { status: 400 })
    }

    let payment
    try {
      payment = await prisma.payment.findUnique({
        where: { reference },
        select: { id: true, userId: true, status: true, amount: true }
      })
    } catch {
      logger.error('Payments.Verify: payment lookup DB error', { requestId })
      return NextResponse.json({ error: 'Failed to retrieve payment' }, { status: 503 })
    }

    if (!payment) {
      logger.warn('Payments.Verify: payment record not found', { requestId })
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404 })
    }

    if (payment.userId !== session.userId) {
      logger.warn('Payments.Verify: payment does not belong to user', {
        requestId,
        paymentUserId: payment.userId,
        sessionUserId: session.userId,
      })
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    if (payment.status === 'success') {
      logger.info('Payments.Verify: payment already verified', { requestId, reference })
      return NextResponse.json({ status: 'success', message: 'Payment already verified' })
    }

    let paystack
    try {
      paystack = await verifyPayment(reference)
    } catch {
      logger.error('Payments.Verify: Paystack verify call failed', { requestId })
      return NextResponse.json({ error: 'Payment verification service unavailable' }, { status: 502 })
    }

    if (!paystack || !paystack.status) {
      logger.warn('Payments.Verify: Paystack verification returned error', {
        requestId,
        message: paystack ? paystack.message : 'Empty response'
      })
      return NextResponse.json({ error: 'Payment not found' })
    }

    const paystackStatus = paystack.data.status
    const paystackRef = String(paystack.data.id)

    const mappedStatus = paystackStatus === 'success' ? 'success' : 
                          paystackStatus === 'abandoned' ? 'abandoned' : 'failed'

    let updatedPayment
    try {
      updatedPayment = await prisma.payment.update({
        where: { reference },
        data: {
          status: mappedStatus,
          paystackRef: paystackRef,
          metadata: JSON.stringify(paystack.data),
        },
      })
    } catch (dbError) {
      logger.error('Payments.Verify: failed to update payment', {
        requestId,
        error: dbError instanceof Error ? dbError.message : 'Unknown error'
      })
      return NextResponse.json({ error: 'Failed to update payment' }, { status: 503 })
    }

    if (mappedStatus === 'success') {
      try {
        const fullPayment = await prisma.payment.findUnique({
          where: { id: updatedPayment.id },
          select: { id: true, userId: true, predictionId: true, amount: true, reference: true },
        })
        if (fullPayment) {
          const prediction = await prisma.prediction.findUnique({
            where: { id: fullPayment.predictionId },
            include: { match: { include: { team_match_homeTeamIdToteam: true, team_match_awayTeamIdToteam: true } } },
          })
          const user = await prisma.user.findUnique({ where: { id: fullPayment.userId } })
          if (user && prediction) {
            await sendTelegramMessage(formatPaymentNotification({
              userName: user.name || 'Anonymous',
              email: user.email,
              amount: fullPayment.amount,
              predictionTitle: prediction.match
                ? `${prediction.match.team_match_homeTeamIdToteam?.name} vs ${prediction.match.team_match_awayTeamIdToteam?.name}`
                : 'Unknown Match',
              reference: fullPayment.reference,
            }))
          }
        }
      } catch { /* don't fail the request */ }
    }

    logger.info('Payments.Verify: payment verified', {
      requestId,
      userId: session.userId,
      reference,
      status: mappedStatus,
    })

    return NextResponse.json({
      status: mappedStatus,
      message: mappedStatus === 'success' ? 'Payment confirmed' : 'Payment not complete',
    })
  } catch (error) {
    logger.error('Payments.Verify: unhandled error', {
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
