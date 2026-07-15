import { createHmac } from 'crypto'

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
const PAYSTACK_API_URL = 'https://api.paystack.co'

interface PaystackInitializeParams {
  email: string
  amount: number
  reference: string
  metadata?: Record<string, unknown>
  callback_url?: string
}

interface PaystackInitializeData {
  authorization_url: string
  access_code: string
  reference: string
}

interface PaystackVerifyData {
  id: number
  domain: string
  status: string
  reference: string
  amount: number
  gateway_response: string
  paid_at: string
  created_at: string
  channel: string
  currency: string
  metadata: Record<string, unknown>
  authorization: {
    authorization_code: string
    bin: string
    last4: string
    exp_month: string
    exp_year: string
    channel: string
    card_type: string
    bank: string
    reusable: boolean
    signature: string
  }
  customer: {
    id: number
    first_name: string
    last_name: string
    email: string
  }
}

interface PaystackApiResponse<T> {
  status: boolean
  message: string
  data: T
}

export async function initializePayment(params: PaystackInitializeParams): Promise<PaystackApiResponse<PaystackInitializeData>> {
  if (!PAYSTACK_SECRET_KEY) throw new Error('PAYSTACK_SECRET_KEY is not configured')

  const res = await fetch(`${PAYSTACK_API_URL}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amount * 100,
      reference: params.reference,
      metadata: params.metadata,
      callback_url: params.callback_url,
    }),
  })

  return res.json()
}

export async function verifyPayment(reference: string): Promise<PaystackApiResponse<PaystackVerifyData>> {
  if (!PAYSTACK_SECRET_KEY) throw new Error('PAYSTACK_SECRET_KEY is not configured')

  const res = await fetch(`${PAYSTACK_API_URL}/transaction/verify/${reference}`, {
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    },
  })

  return res.json()
}

export function generateReference(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `PBP_${timestamp}_${random}`.toUpperCase()
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured')
  }
  const hash = createHmac('sha512', PAYSTACK_SECRET_KEY).update(body).digest('hex')
  return hash === signature
}
