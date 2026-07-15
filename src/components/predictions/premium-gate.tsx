'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { PurchaseButton } from './purchase-button'
import { Lock, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface PremiumGateProps {
  predictionId: string
  amount?: number
  children: React.ReactNode
}

export function PremiumGate({ predictionId, amount, children }: PremiumGateProps) {
  const { user, loading: authLoading } = useAuth()
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading || !user) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setLoading(false)
      /* eslint-enable react-hooks/set-state-in-effect */
      return
    }

    const checkAccess = async () => {
      try {
        const res = await fetch(`/api/predictions/${predictionId}/access`)
        if (res.ok) {
          const data = await res.json()
          setHasAccess(data.hasAccess)
        }
      } catch {
        setHasAccess(false)
      } finally {
        setLoading(false)
      }
    }

    checkAccess()
  }, [predictionId, user, authLoading])

  if (authLoading || loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-surface-tertiary rounded w-3/4 mx-auto" />
            <div className="h-4 bg-surface-tertiary rounded w-1/2 mx-auto" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (hasAccess) {
    return <>{children}</>
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background-primary/90 z-10" />
      <div className="relative blur-sm pointer-events-none select-none opacity-60">
        {children}
      </div>
      <div className="absolute inset-0 z-20 flex items-center justify-center">
        <div className="text-center space-y-4 p-6 bg-background-primary/95 backdrop-blur-sm rounded-xl border border-surface-secondary shadow-lg max-w-sm mx-4">
          <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-text-primary flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              Premium Prediction
            </h3>
            <p className="text-sm text-text-secondary mt-1">
              Unlock this expert prediction with detailed analysis and betting tips
            </p>
          </div>
          <PurchaseButton predictionId={predictionId} amount={amount} />
        </div>
      </div>
    </Card>
  )
}
