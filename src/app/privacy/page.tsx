import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'PrimeBettingPicks privacy policy. Learn how we collect, use, protect, and handle your personal information and data on our football predictions platform.',
}

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-text-primary mb-8">Privacy Policy</h1>
      <div className="text-text-secondary space-y-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-text-primary [&_h2]:mt-8 [&_h2]:mb-4">
        <p>Last updated: January 2024</p>
        <h2>Information We Collect</h2>
        <p>
          We collect information you provide directly to us, including name, email address, 
          and account preferences when you register for our service.
        </p>
        <h2>How We Use Your Information</h2>
        <p>
          We use the information we collect to provide, maintain, and improve our services, 
          to send you technical notices and support messages, and to communicate with you 
          about our services.
        </p>
        <h2>Data Protection</h2>
        <p>
          We implement appropriate security measures to protect your personal information 
          from unauthorized access, alteration, disclosure, or destruction.
        </p>
        <h2>Cookies</h2>
        <p>
          We use cookies and similar tracking technologies to track activity on our service 
          and hold certain information to improve your experience.
        </p>
        <h2>Contact</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact us at 
          privacy@primebettingpicks.com.
        </p>
      </div>
    </div>
  )
}
