import type React from 'react'

import type { FieldManager } from './FieldManager'

export function FieldLabel({
  id,
  children,
  field,
  className,
  requiredIndicator = '*',
  requiredClassName,
}: {
  id?: string
  className?: string
  requiredIndicator?: React.ReactNode
  requiredClassName?: string
  field: FieldManager<any>
  children?: React.ReactNode
}) {
  return (
    <label htmlFor={id ?? field.name} className={className}>
      {children || field.name}
      {field.options.required && (
        <span className={requiredClassName} aria-hidden="true">
          {requiredIndicator}
        </span>
      )}
    </label>
  )
}
