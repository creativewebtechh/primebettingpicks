import type { Metadata } from 'next'
import { LiveScoresList } from '@/components/common/live-scores-list'

export const metadata: Metadata = {
  title: 'Live Football Scores & Results',
  description: 'Track live football scores in real-time. Get instant match updates, goals, cards, and statistics from all major leagues and competitions worldwide.',
}

export default function LiveScoresPage() {
  return <LiveScoresList />
}
