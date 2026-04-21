import type { FieldManager } from './FieldManager';

export function FieldError({
  field,
  id,
  className,
}: {
  id?: string;
  className?: string;
  field: FieldManager<any>;
}) {
  if (!field.state.error) return null;

  return (
    <div id={id} className={className} role="status" aria-live="polite">
      {field.state.error}
    </div>
  );
}
