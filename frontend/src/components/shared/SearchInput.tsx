/**
 * SearchInput – Reusable search input (Plan 3, US-018).
 * Phase 2: Stub with value, placeholder, onSearch, aria. Phase 3: integrate on Records page.
 */

import * as React from 'react'

export interface SearchInputProps {
  value: string
  onSearch: (value: string) => void
  placeholder?: string
  debounceMs?: number
  ariaLabel?: string
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onSearch,
  placeholder = 'Search…',
  debounceMs,
  ariaLabel,
}) => {
  const [localValue, setLocalValue] = React.useState(value)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  React.useEffect(() => setLocalValue(value), [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setLocalValue(v)
    if (debounceMs == null || debounceMs <= 0) {
      onSearch(v)
    } else {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        onSearch(v)
        debounceRef.current = null
      }, debounceMs)
    }
  }

  React.useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }, [])

  return (
    <input
      type="search"
      role="searchbox"
      aria-label={ariaLabel ?? placeholder}
      placeholder={placeholder}
      value={localValue}
      onChange={handleChange}
    />
  )
}

SearchInput.displayName = 'SearchInput'
