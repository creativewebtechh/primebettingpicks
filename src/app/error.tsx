'use client'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-text-primary mb-4">Something went wrong</h2>
        <p className="text-text-secondary mb-6">{error.message}</p>
        <button onClick={reset} className="px-6 py-3 bg-accent text-white rounded-lg">Try again</button>
      </div>
    </div>
  )
}
