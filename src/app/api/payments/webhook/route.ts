import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { verifyWebhookSignature } from '@/lib/paystack'
import { sendTelegramMessage, formatPaymentNotification } from '@/lib/telegram'

export const dynamic = 'force-dynamic'

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

export async function POST(request: Request) {
  const requestId = crypto.randomUUID().slice(0, 8)
  const rawBody = await request.clone().text()

  try {
    const signature = request.headers.get('x-paystack-signature')
    if (!signature || !PAYSTACK_SECRET_KEY) {
      logger.warn('Payments.Webhook: missing signature or secret', { requestId })
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const isValid = verifyWebhookSignature(rawBody, signature)
    if (!isValid) {
      logger.warn('Payments.Webhook: invalid signature', { requestId })
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = JSON.parse(rawBody)
    const event = body.event

    if (event !== 'charge.success') {
      logger.info('Payments.Webhook: unhandled event', { requestId, event })
      return NextResponse.json({ received: true })
    }

    const reference = body.data?.reference
    if (!reference) {
      logger.warn('Payments.Webhook: charge.success missing reference', { requestId })
      return NextResponse.json({ error: 'Missing reference' }, { status: 400 })
    }

    let payment: { id: string; status: string } | null = null
    try {
      payment = await prisma.payment.findUnique({
        where: { reference }
      })
    } catch {
      logger.error('Payments.Webhook: DB lookup error', { requestId })
      return NextResponse.json({ error: 'Internal error' }, { status: 503 })
    }

    if (!payment) {
      logger.warn('Payments.Webhook: payment not found', { requestId, reference })
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    if (payment.status === 'success') {
      logger.info('Payments.Webhook: payment already succeeded', { requestId, reference })
      return NextResponse.json({ received: true })
    }

    const paystackData = body.data
    const paystackRef = String(paystackData.id)

    try {
      await prisma.payment.update({
        where: { reference },
        data: {
          status: 'success',
          paystackRef: paystackRef,
          metadata: rawBody,
        },
      })
    } catch (dbError) {
      logger.error('Payments.Webhook: failed to update payment', {
        requestId,
        error: dbError instanceof Error ? dbError.message : 'Unknown error'
      })
      return NextResponse.json({ error: 'Internal error' }, { status: 503 })
    }

    try {
      const fullPayment = await prisma.payment.findUnique({
        where: { reference },
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

    logger.info('Payments.Webhook: payment succeeded', {
      requestId,
      paymentId: payment.id,
      reference,
      amount: paystackData.amount,
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    logger.error('Payments.Webhook: unhandled error', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
