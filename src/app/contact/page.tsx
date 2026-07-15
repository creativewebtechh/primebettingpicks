import type { Metadata } from 'next'
import { ContactForm } from '@/components/contact-form'

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with PrimeBettingPicks. Reach out for support, feedback, or partnership inquiries about football predictions and betting tips.',
}

export default function ContactPage() {
  return <ContactForm />
}
