import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'PrimeBettingPicks terms of service. Read the rules, conditions, and guidelines for using our football predictions and betting tips platform.',
}

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-text-primary mb-8">Terms of Service</h1>
      <div className="text-text-secondary space-y-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-text-primary [&_h2]:mt-8 [&_h2]:mb-4">
        <p>Last updated: January 2024</p>
        <h2>Acceptance of Terms</h2>
        <p>
          By accessing and using PrimeBettingPicks, you agree to be bound by these Terms of Service. 
          If you do not agree with any part of the terms, you may not use our service.
        </p>
        <h2>Service Description</h2>
        <p>
          PrimeBettingPicks provides football predictions, betting tips, and statistical analysis 
          for informational and entertainment purposes only. We do not guarantee the accuracy 
          of predictions or outcomes.
        </p>
        <h2>User Responsibilities</h2>
        <p>
          Users are responsible for maintaining the confidentiality of their account credentials 
          and for all activities that occur under their account. You must be at least 18 years 
          old to use this service.
        </p>
        <h2>Responsible Gambling</h2>
        <p>
          Our content is for informational purposes only. Betting involves financial risk. 
          Never bet more than you can afford to lose. If you have a gambling problem, 
          please seek professional help.
        </p>
        <h2>Intellectual Property</h2>
        <p>
          All content, analysis, and predictions on this platform are our intellectual property 
          and may not be reproduced without permission.
        </p>
        <h2>Limitation of Liability</h2>
        <p>
          We shall not be liable for any losses or damages arising from the use of our 
          predictions or betting tips. Users assume all risks associated with betting.
        </p>
      </div>
    </div>
  )
}
