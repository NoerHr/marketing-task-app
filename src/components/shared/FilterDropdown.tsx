import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, Check, X } from 'lucide-react'

interface FilterDropdownProps<T extends { id: string }> {
  label: string
  items: T[]
  selectedIds: string[]
  onToggle: (id: string) => void
  getLabel: (item: T) => string
  renderDot?: (item: T) => React.ReactNode
}

export function FilterDropdown<T extends { id: string }>({
  label, items, selectedIds, onToggle, getLabel, renderDot,
}: FilterDropdownProps<T>) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const filtered = items.filter(i => getLabel(i).toLowerCase().includes(query.toLowerCase()))
  const count = selectedIds.length

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold transition-all ${
          count > 0
            ? 'bg-indigo-500/10 text-indigo-600 ring-1 ring-indigo-500/20 dark:bg-indigo-500/15 dark:text-indigo-400'
            : 'text-slate-500 hover:bg-slate-100/60 dark:text-slate-400 dark:hover:bg-slate-700/30'
        }`}
      >
        {label}
        {count > 0 && (
          <span className="flex size-4 items-center justify-center rounded-full bg-indigo-500 text-[9px] font-bold text-white">{count}</span>
        )}
        <ChevronDown className={`size-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-xl border border-white/60 bg-white/95 shadow-xl backdrop-blur-2xl dark:border-slate-700/40 dark:bg-slate-900/95">
          {/* Search */}
          <div className="flex items-center gap-2 border-b border-slate-200/40 px-3 py-2 dark:border-slate-700/30">
            <Search className="size-3 shrink-0 text-slate-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-full bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200 dark:placeholder:text-slate-500"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600">
                <X className="size-3" />
              </button>
            )}
          </div>

          {/* Selected tags */}
          {count > 0 && (
            <div className="flex flex-wrap gap-1 border-b border-slate-200/40 px-3 py-2 dark:border-slate-700/30">
              {items.filter(i => selectedIds.includes(i.id)).map(item => (
                <span key={item.id} className="flex items-center gap-1 rounded-md bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                  {renderDot?.(item)}
                  {getLabel(item)}
                  <button onClick={() => onToggle(item.id)} className="text-indigo-400 hover:text-indigo-600">
                    <X className="size-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Options list */}
          <div className="max-h-48 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-center text-[11px] text-slate-400">{query ? 'No results' : 'No items'}</p>
            ) : (
              filtered.map(item => {
                const selected = selectedIds.includes(item.id)
                return (
                  <button
                    key={item.id}
                    onClick={() => onToggle(item.id)}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[11px] transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                  >
                    <span className={`flex size-3.5 shrink-0 items-center justify-center rounded border transition-colors ${
                      selected
                        ? 'border-indigo-500 bg-indigo-500 text-white'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}>
                      {selected && <Check className="size-2.5" />}
                    </span>
                    {renderDot?.(item)}
                    <span className={`truncate font-medium ${selected ? 'text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}>
                      {getLabel(item)}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
