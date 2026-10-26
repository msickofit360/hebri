import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Tip } from '@/components/ui/tooltip'
import { useI18n } from '@/i18n'
import { localizeBuiltinText } from '@/i18n/builtin-metadata'
import { Check, Info } from '@/lib/icons'
import type { MemoryProviderField } from '@/types/hermes'

import { CONTROL_TEXT } from '../constants'

// Fade the placeholder well below set values so example text never reads as data.
const FIELD_INPUT = `font-mono ${CONTROL_TEXT} placeholder:text-muted-foreground/45`

// Field label with an optional info tooltip, shared by the panel and modal rows.
export function FieldTitle({ field }: { field: MemoryProviderField }) {
  const { t } = useI18n()

  if (!field.info) {
    return <>{localizeBuiltinText(field.label, t)}</>
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      {localizeBuiltinText(field.label, t)}
      <Tip className="max-w-60 font-normal leading-snug whitespace-normal" label={localizeBuiltinText(field.info, t)}>
        <Info
          aria-label={t.additional.memory.about(localizeBuiltinText(field.label, t))}
          className="size-3.5 text-muted-foreground/70"
        />
      </Tip>
    </span>
  )
}

// Values are edited as strings; the backend coerces them to native types.
export function FieldControl({
  field,
  value,
  onChange,
  onCommit
}: {
  field: MemoryProviderField
  value: string
  onChange: (value: string) => void
  // Present on autosaving surfaces: discrete controls commit on change, text-like
  // controls commit on blur. Absent (the modal), edits stay drafts until Save.
  onCommit?: (value: string) => void
}) {
  const { t } = useI18n()

  const set = (next: string) => {
    onChange(next)
    onCommit?.(next)
  }

  const commitDraft = onCommit ? () => onCommit(value) : undefined

  if (field.kind === 'bool') {
    return <Switch checked={value === 'true'} onCheckedChange={checked => set(checked ? 'true' : 'false')} />
  }

  if (field.kind === 'number') {
    return (
      <Input
        className={FIELD_INPUT}
        inputMode="numeric"
        onBlur={commitDraft}
        onChange={event => onChange(event.target.value)}
        placeholder={localizeBuiltinText(field.placeholder, t)}
        type="number"
        value={value}
      />
    )
  }

  if (field.kind === 'json') {
    return (
      <Textarea
        className={FIELD_INPUT}
        onBlur={commitDraft}
        onChange={event => onChange(event.target.value)}
        placeholder={localizeBuiltinText(field.placeholder, t)}
        spellCheck={false}
        value={value}
      />
    )
  }

  if (field.kind === 'select') {
    return (
      <Select onValueChange={set} value={value}>
        <SelectTrigger className={CONTROL_TEXT}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {field.options.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {localizeBuiltinText(option.label, t)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  if (field.kind === 'secret') {
    return (
      <div className="flex flex-col gap-1">
        <Input
          className={`w-full ${FIELD_INPUT}`}
          onBlur={commitDraft}
          onChange={event => onChange(event.target.value)}
          placeholder={field.is_set ? t.additional.memory.keepValue : localizeBuiltinText(field.placeholder, t)}
          type="password"
          value={value}
        />
        {field.is_set && (
          <span className="inline-flex items-center gap-1 self-start font-mono text-[0.65rem] text-(--ui-text-tertiary)">
            <Check className="size-3 text-(--ui-accent-secondary)" />
            {t.additional.memory.isSet}
          </span>
        )}
      </div>
    )
  }

  return (
    <Input
      className={FIELD_INPUT}
      onBlur={commitDraft}
      onChange={event => onChange(event.target.value)}
      placeholder={localizeBuiltinText(field.placeholder, t)}
      value={value}
    />
  )
}
