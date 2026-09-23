import clsx from 'clsx'
import type { HTMLAttributes, ReactNode } from 'react'

/** Superfície de conteúdo (não é vidro): tabela, gráficos, painéis de leitura. */
export function Surface({ className, children, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={clsx('rounded-[18px] border border-line bg-surface shadow-[var(--shadow-surface)]', className)}
      {...props}
    >
      {children}
    </section>
  )
}

export function SurfaceHeader({
  title,
  subtitle,
  action,
  id,
  className,
}: {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  id?: string
  className?: string
}) {
  return (
    <header className={clsx('flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-5 pt-4 pb-3', className)}>
      <div className="min-w-0">
        <h2 id={id} className="text-[15px] font-semibold tracking-[-0.01em] text-fg">
          {title}
        </h2>
        {subtitle && <p className="mt-0.5 text-[13px] text-fg-3">{subtitle}</p>}
      </div>
      {action}
    </header>
  )
}
