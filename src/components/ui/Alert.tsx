import clsx from 'clsx'
import type { ReactNode } from 'react'
import { Icon, type NomeIcone } from './Icon'

type Tone = 'info' | 'warning' | 'danger' | 'success'

const tons: Record<Tone, { classes: string; icone: NomeIcone }> = {
  info: { classes: 'bg-info-soft text-fg [&_[data-icone]]:text-info', icone: 'info' },
  warning: { classes: 'bg-warning-soft text-fg [&_[data-icone]]:text-warning', icone: 'alerta' },
  danger: { classes: 'bg-negative-soft text-fg [&_[data-icone]]:text-negative', icone: 'alerta' },
  success: { classes: 'bg-positive-soft text-fg [&_[data-icone]]:text-positive', icone: 'check' },
}

export function Alert({
  tone = 'info',
  title,
  children,
  action,
  className,
}: {
  tone?: Tone
  title?: string
  children?: ReactNode
  action?: ReactNode
  className?: string
}) {
  const t = tons[tone]
  return (
    <div
      className={clsx('flex gap-3 rounded-xl px-4 py-3 text-sm', t.classes, className)}
      role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'}
    >
      <span data-icone className="mt-0.5 shrink-0">
        <Icon nome={t.icone} className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={clsx(title && 'mt-0.5', 'text-[13px] leading-relaxed text-fg-2')}>{children}</div>}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  )
}
