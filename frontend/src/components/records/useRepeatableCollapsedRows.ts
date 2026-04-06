import { useEffect, useRef, useState } from 'react'

/**
 * Keeps a parallel `collapsed[]` aligned with `rows.length` for collapsible repeatables.
 * New rows default to expanded when empty; when the row has content, default is collapsed.
 */
export function useRepeatableCollapsedRows<T>(
  rows: T[],
  rowHasContent: (row: T) => boolean,
): {
  isCollapsed: (index: number) => boolean
  toggle: (index: number) => void
} {
  const [collapsed, setCollapsed] = useState<boolean[]>([])
  const rowsRef = useRef(rows)
  rowsRef.current = rows

  useEffect(() => {
    const r = rowsRef.current
    setCollapsed((prev) => {
      if (r.length === prev.length) return prev
      if (r.length > prev.length) {
        const added = r.slice(prev.length)
        return [...prev, ...added.map((row) => rowHasContent(row))]
      }
      return prev.slice(0, r.length)
    })
  }, [rows.length, rowHasContent])

  const isCollapsed = (index: number) => {
    const row = rows[index]
    if (row === undefined) return true
    return collapsed[index] ?? rowHasContent(row)
  }

  const toggle = (index: number) => {
    setCollapsed((prev) => {
      const r = rowsRef.current
      const next = [...prev]
      while (next.length < r.length) {
        next.push(rowHasContent(r[next.length]!))
      }
      const cur = next[index] ?? rowHasContent(r[index]!)
      next[index] = !cur
      return next
    })
  }

  return { isCollapsed, toggle }
}
