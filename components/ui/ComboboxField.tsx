'use client'

import {
  Combobox,
  Field,
  HStack,
  Text,
  VisuallyHidden,
  useFilter,
  useListCollection,
} from '@chakra-ui/react'
import { FloatingPortal } from './FloatingPortal'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

export interface Option {
  value: string
  label: string
  icon?: ReactNode
  disabled?: boolean
}

interface Props {
  label: string
  /** '' means no selection. */
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string
  required?: boolean
  /** Shows "(opcional)" next to the label. */
  optional?: boolean
  disabled?: boolean
  invalid?: boolean
  errorText?: string
  helperText?: string
  /** Defaults to !required. */
  clearable?: boolean
  emptyText?: string
  /** Visually hide the label (it stays as the accessible name). */
  hideLabel?: boolean
  size?: 'sm' | 'md'
  maxW?: string
}

/**
 * Searchable select built on Chakra's Combobox. Filtering ignores case and
 * accents; the value only changes when an option is picked (no free text),
 * so it emits exactly the same values as the native select it replaces.
 */
export function ComboboxField({
  label,
  value,
  onChange,
  options,
  placeholder,
  required,
  optional,
  disabled,
  invalid,
  errorText,
  helperText,
  clearable = !required,
  emptyText = 'Sin resultados',
  hideLabel,
  size = 'md',
  maxW,
}: Props) {
  const { contains } = useFilter({ sensitivity: 'base' })
  const { collection, filter, set, reset } = useListCollection({
    initialItems: options,
    filter: contains,
    itemToString: (o) => o.label,
    itemToValue: (o) => o.value,
    isItemDisabled: (o) => !!o.disabled,
  })

  // Callers usually build `options` inline; only resync when the content changes.
  const optionsKey = useMemo(
    () => options.map((o) => `${o.value}\u0000${o.label}\u0000${o.disabled ? 1 : 0}`).join('\u0001'),
    [options]
  )
  useEffect(() => {
    set(options)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on optionsKey on purpose
  }, [optionsKey, set])

  // Controlled input text: when the list closes without a pick, go back to the
  // current option's label instead of leaving the search text behind.
  const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? ''
  const [inputValue, setInputValue] = useState(() => labelOf(value))
  const [syncedValue, setSyncedValue] = useState(value)
  if (value !== syncedValue) {
    setSyncedValue(value)
    setInputValue(labelOf(value))
  }
  // Latest picked value: onOpenChange can fire before the parent re-renders.
  const pickedRef = useRef(value)
  pickedRef.current = value

  return (
    <Field.Root required={required} disabled={disabled} invalid={invalid} w="full" maxW={maxW}>
      <Combobox.Root
        collection={collection}
        value={value ? [value] : []}
        onValueChange={(e) => {
          const next = e.value[0] ?? ''
          pickedRef.current = next
          onChange(next)
        }}
        inputValue={inputValue}
        onInputValueChange={(e) => {
          setInputValue(e.inputValue)
          filter(e.inputValue)
        }}
        onOpenChange={(e) => {
          if (e.open) return
          reset()
          setInputValue(labelOf(pickedRef.current))
        }}
        openOnClick
        selectionBehavior="replace"
        colorPalette="brand"
        size={size}
        width="full"
      >
        {hideLabel ? (
          <VisuallyHidden asChild>
            <Combobox.Label>{label}</Combobox.Label>
          </VisuallyHidden>
        ) : (
          <Combobox.Label>
            {label}
            {required && <Field.RequiredIndicator />}
            {optional && (
              <Text as="span" color="text.secondary" fontWeight="normal" ms={1}>
                (opcional)
              </Text>
            )}
          </Combobox.Label>
        )}
        <Combobox.Control>
          <Combobox.Input placeholder={placeholder} />
          <Combobox.IndicatorGroup>
            {clearable && value && <Combobox.ClearTrigger aria-label="Limpiar selección" />}
            <Combobox.Trigger aria-label={`Abrir ${label}`} />
          </Combobox.IndicatorGroup>
        </Combobox.Control>
        <FloatingPortal>
          <Combobox.Positioner>
            <Combobox.Content colorPalette="brand">
              <Combobox.Empty>{emptyText}</Combobox.Empty>
              {collection.items.map((item) => (
                <Combobox.Item key={item.value} item={item}>
                  <Combobox.ItemText>
                    <HStack gap={2} as="span">
                      {item.icon && <span aria-hidden>{item.icon}</span>}
                      <span>{item.label}</span>
                    </HStack>
                  </Combobox.ItemText>
                  <Combobox.ItemIndicator />
                </Combobox.Item>
              ))}
            </Combobox.Content>
          </Combobox.Positioner>
        </FloatingPortal>
      </Combobox.Root>
      {helperText && <Field.HelperText>{helperText}</Field.HelperText>}
      {errorText && <Field.ErrorText>{errorText}</Field.ErrorText>}
    </Field.Root>
  )
}
