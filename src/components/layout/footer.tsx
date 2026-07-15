import Link from 'next/link'

const FOOTER_LINKS = {
  Predictions: [
    { label: 'Football Predictions', href: '/predictions' },
    { label: 'Today\'s Matches', href: '/predictions?filter=today' },
    { label: 'Expert Picks', href: '/predictions?filter=experts' },
    { label: 'Accumulator Tips', href: '/predictions?filter=accumulators' },
  ],
  Leagues: [
    { label: 'Premier League', href: '/leagues/premier-league' },
    { label: 'La Liga', href: '/leagues/la-liga' },
    { label: 'Serie A', href: '/leagues/serie-a' },
    { label: 'Bundesliga', href: '/leagues/bundesliga' },
    { label: 'Champions League', href: '/leagues/champions-league' },
  ],
  Resources: [
    { label: 'Statistics', href: '/statistics' },
    { label: 'Teams', href: '/teams' },
    { label: 'News', href: '/news' },
    { label: 'Bookmakers', href: '/bookmakers' },
  ],
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
}

export function Footer() {
  return (
    <footer className="bg-surface-secondary border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PB</span>
              </div>
              <span className="font-bold text-xl text-text-primary">
                Prime<span className="text-primary-600">BettingPicks</span>
              </span>
            </Link>
            <p className="text-sm text-text-secondary mb-4">
              Premium football predictions and betting tips from expert analysts.
              Covering all major leagues and competitions worldwide.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-semibold text-text-primary mb-3">{title}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-text-secondary hover:text-primary-600 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-8 border-t border-border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-text-muted">
              &copy; {new Date().getFullYear()} PrimeBettingPicks. All rights reserved.
              Betting involves financial risk. Please gamble responsibly.
            </p>
            <div className="flex items-center gap-4 text-xs text-text-muted">
              <Link href="/privacy" className="hover:text-primary-600">Privacy</Link>
              <Link href="/terms" className="hover:text-primary-600">Terms</Link>
              <Link href="/contact" className="hover:text-primary-600">Contact</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
