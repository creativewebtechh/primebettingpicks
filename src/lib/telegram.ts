const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

interface PaymentNotification {
  userName: string
  email: string | null
  amount: number
  predictionTitle: string
  reference: string
}

interface NewUserNotification {
  name: string
  email: string
}

export async function sendTelegramMessage(message: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return false
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'HTML',
        }),
      }
    )
    return res.ok
  } catch {
    return false
  }
}

export function formatPaymentNotification(data: PaymentNotification): string {
  return [
    '💰 <b>Payment Successful</b>',
    '',
    `👤 <b>User:</b> ${data.userName} (${data.email || 'no email'})`,
    `⚽ <b>Match:</b> ${data.predictionTitle}`,
    `💵 <b>Amount:</b> ₦${(data.amount / 100).toLocaleString()}`,
    `🔖 <b>Reference:</b> ${data.reference}`,
  ].join('\n')
}

export function formatNewUserNotification(data: NewUserNotification): string {
  return [
    '🆕 <b>New User Registration</b>',
    '',
    `👤 <b>Name:</b> ${data.name}`,
    `📧 <b>Email:</b> ${data.email}`,
  ].join('\n')
}

export function formatAdminBroadcast(message: string): string {
  return [
    '📢 <b>Admin Broadcast</b>',
    '',
    message,
  ].join('\n')
}
