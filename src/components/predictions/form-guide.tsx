import { cn, getTeamFormColor } from '@/lib/utils'

interface FormGuideProps {
  form: string
  size?: 'sm' | 'md'
}

export function FormGuide({ form, size = 'sm' }: FormGuideProps) {
  const results = form.split('').slice(0, 5)

  return (
    <div className="flex gap-0.5">
      {results.map((result, idx) => (
        <span
          key={idx}
          className={cn(
            'inline-flex items-center justify-center font-bold text-white rounded',
            getTeamFormColor(result),
            size === 'sm' ? 'w-4 h-4 text-[9px]' : 'w-5 h-5 text-[10px]'
          )}
        >
          {result}
        </span>
      ))}
    </div>
  )
}
