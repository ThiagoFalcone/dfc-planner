import clsx from 'clsx'
import type { ReactNode } from 'react'

type Tone = 'info' | 'warning' | 'danger' | 'success'

const toneClasses: Record<Tone, string> = {
  info: 'bg-brand-50 border-brand-200 text-brand-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  danger: 'bg-red-50 border-red-200 text-red-800',
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
}

export function Alert({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: Tone
  title?: string
  children?: ReactNode
  className?: string
}) {
  return (
    <div className={clsx('rounded-xl border px-4 py-3 text-sm', toneClasses[tone], className)} role="alert">
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={clsx(title && 'mt-1', 'text-[13px] leading-relaxed')}>{children}</div>}
    </div>
  )
}
