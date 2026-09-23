import clsx from 'clsx'
import { type InputHTMLAttributes, forwardRef, useId } from 'react'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  prefix?: string
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { className, label, error, hint, prefix, id, ...props },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink-700">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {prefix && (
          <span className="pointer-events-none absolute left-3 text-sm text-ink-400 tabular">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={clsx(
            'h-10 w-full rounded-xl border bg-white text-sm text-ink-900 outline-none transition-colors',
            'placeholder:text-ink-300',
            'focus:border-brand-500 focus:ring-2 focus:ring-brand-100',
            prefix ? 'pl-9 pr-3' : 'px-3',
            error ? 'border-negative focus:border-negative focus:ring-red-100' : 'border-ink-200',
            className,
          )}
          {...props}
        />
      </div>
      {error && (
        <p id={`${inputId}-error`} className="text-xs font-medium text-negative">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={`${inputId}-hint`} className="text-xs text-ink-400">
          {hint}
        </p>
      )}
    </div>
  )
})
