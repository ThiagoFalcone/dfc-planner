import clsx from 'clsx'
import { type InputHTMLAttributes, type ReactNode, forwardRef, useId } from 'react'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: ReactNode
  labelAction?: ReactNode
}

export const campoClasses =
  'h-10 w-full rounded-[10px] border bg-surface px-3 text-sm text-fg outline-none transition-[border-color,box-shadow] duration-120 placeholder:text-fg-3 focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-soft)]'

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { className, label, error, hint, labelAction, id, ...props },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const descricao = error ? `${inputId}-erro` : hint ? `${inputId}-dica` : undefined

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <div className="flex items-baseline justify-between gap-2">
          <label htmlFor={inputId} className="text-[13px] font-medium text-fg-2">
            {label}
          </label>
          {labelAction}
        </div>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={!!error || undefined}
        aria-describedby={descricao}
        className={clsx(
          campoClasses,
          error ? 'border-negative focus:border-negative focus:shadow-[0_0_0_3px_var(--negative-soft)]' : 'border-line-strong',
          className,
        )}
        {...props}
      />
      {error && (
        <p id={`${inputId}-erro`} className="text-xs font-medium text-negative">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={`${inputId}-dica`} className="text-xs text-fg-3">
          {hint}
        </p>
      )}
    </div>
  )
})
