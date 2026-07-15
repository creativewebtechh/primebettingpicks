import type { Metadata } from 'next'
import { Trophy, Target, Shield, Users } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About PrimeBettingPicks',
  description: 'Learn about PrimeBettingPicks - our mission to deliver expert football predictions, data-driven betting tips, and transparent match analysis from professional analysts.',
}

const VALUES = [
  { icon: Target, title: 'Accuracy', description: 'Data-driven predictions with proven track record of success.' },
  { icon: Shield, title: 'Transparency', description: 'All predictions tracked and verified for accountability.' },
  { icon: Trophy, title: 'Expertise', description: 'Team of seasoned analysts with deep football knowledge.' },
  { icon: Users, title: 'Community', description: 'Building a community of informed, responsible bettors.' },
]

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-text-primary mb-4">About PrimeBettingPicks</h1>
        <p className="text-lg text-text-secondary">
          We are dedicated to providing the most accurate football predictions and betting tips 
          through comprehensive data analysis and expert insight.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {VALUES.map((value) => {
          const Icon = value.icon
          return (
            <div key={value.title} className="bg-surface rounded-xl border border-border p-6">
              <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-text-primary mb-2">{value.title}</h3>
              <p className="text-sm text-text-secondary">{value.description}</p>
            </div>
          )
        })}
      </div>

      <div className="text-text-secondary space-y-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-text-primary [&_h2]:mt-8 [&_h2]:mb-4">
        <h2>Our Mission</h2>
        <p>
          At PrimeBettingPicks, our mission is to help bettors make informed decisions through 
          expert analysis, statistical modeling, and comprehensive match previews. We cover all 
          major football leagues and competitions worldwide.
        </p>
        <h2>Our Team</h2>
        <p>
          Our team consists of experienced football analysts, data scientists, and former 
          professional bettors who combine their expertise to deliver high-quality predictions 
          and betting insights.
        </p>
        <h2>Responsible Betting</h2>
        <p>
          We promote responsible gambling. Our predictions are for informational purposes only, 
          and we encourage our users to bet within their means and seek help if needed.
        </p>
      </div>
    </div>
  )
}
