import { useState, useRef, useEffect, useMemo } from 'react'
import {
  X,
  Plus,
  ChevronDown,
  ChevronUp,
  Trash2,
  Bell,
  DollarSign,
  Users,
  FileText,
  ToggleLeft,
  ToggleRight,
  Search,
  Pencil,
  AlertTriangle,
} from 'lucide-react'
import type {
  ActivityTypeOption,
  UserOption,
  ReminderTemplate,
  ReminderConfig,
  ReminderTrigger,
  ReminderChannel,
  CreateActivityForm,
  ActivityEditData,
} from '@/types/calendar'

/* ─── Constants ─── */

const HIDE_SCROLL = '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden'

const COLOR_MAP: Record<string, { dot: string; tagBg: string; tagText: string }> = {
  rose:   { dot: 'bg-rose-500',   tagBg: 'bg-rose-100 dark:bg-rose-500/15',     tagText: 'text-rose-700 dark:text-rose-300' },
  violet: { dot: 'bg-violet-500', tagBg: 'bg-violet-100 dark:bg-violet-500/15', tagText: 'text-violet-700 dark:text-violet-300' },
  pink:   { dot: 'bg-pink-500',   tagBg: 'bg-pink-100 dark:bg-pink-500/15',     tagText: 'text-pink-700 dark:text-pink-300' },
  amber:  { dot: 'bg-amber-500',  tagBg: 'bg-amber-100 dark:bg-amber-500/15',   tagText: 'text-amber-700 dark:text-amber-300' },
  teal:   { dot: 'bg-teal-500',   tagBg: 'bg-teal-100 dark:bg-teal-500/15',     tagText: 'text-teal-700 dark:text-teal-300' },
  sky:    { dot: 'bg-sky-500',    tagBg: 'bg-sky-100 dark:bg-sky-500/15',       tagText: 'text-sky-700 dark:text-sky-300' },
  indigo: { dot: 'bg-indigo-500', tagBg: 'bg-indigo-100 dark:bg-indigo-500/15', tagText: 'text-indigo-700 dark:text-indigo-300' },
}

const TRIGGERS: { value: ReminderTrigger; label: string }[] = [
  { value: 'H-7', label: 'H-7 (7 days before)' },
  { value: 'H-3', label: 'H-3 (3 days before)' },
  { value: 'H-1', label: 'H-1 (1 day before)' },
  { value: 'Day-H', label: 'Day-H (On the day)' },
  { value: 'Custom', label: 'Custom' },
]

const INPUT = 'w-full rounded-xl border border-slate-200/50 bg-white/50 px-3 py-2.5 text-sm text-slate-700 backdrop-blur-sm transition-all placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300/30 dark:border-slate-700/40 dark:bg-slate-800/40 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-indigo-500/50 dark:focus:ring-indigo-500/20'
const LABEL = 'mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400'

/* ─── Searchable Tag Input ─── */

interface TagInputProps<T> {
  items: T[]
  selectedIds: string[]
  onToggle: (id: string) => void
  getId: (item: T) => string
  getLabel: (item: T) => string
  placeholder: string
  multiple?: boolean
  renderTag?: (item: T, onRemove: () => void) => React.ReactNode
  renderOption?: (item: T) => React.ReactNode
}

function TagInput<T>({
  items, selectedIds, onToggle, getId, getLabel, placeholder, multiple = true,
  renderTag, renderOption,
}: TagInputProps<T>) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = items.filter(i => selectedIds.includes(getId(i)))
  const filtered = items.filter(i =>
    !selectedIds.includes(getId(i)) &&
    getLabel(i).toLowerCase().includes(query.toLowerCase())
  )

  const handleSelect = (id: string) => {
    if (!multiple) {
      // Single select: deselect existing first
      selectedIds.forEach(sid => onToggle(sid))
    }
    onToggle(id)
    setQuery('')
    if (!multiple) setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200/50 bg-white/50 px-2.5 py-2 backdrop-blur-sm transition-all focus-within:border-indigo-300 focus-within:ring-1 focus-within:ring-indigo-300/30 dark:border-slate-700/40 dark:bg-slate-800/40 dark:focus-within:border-indigo-500/50 dark:focus-within:ring-indigo-500/20">
        {selected.map(item => {
          const id = getId(item)
          const remove = () => onToggle(id)
          if (renderTag) return <span key={id}>{renderTag(item, remove)}</span>
          return (
            <span key={id} className="flex items-center gap-1 rounded-lg bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
              {getLabel(item)}
              <button type="button" onClick={remove} className="ml-0.5 rounded text-indigo-400 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-200">
                <X className="size-3" />
              </button>
            </span>
          )
        })}
        <div className="flex min-w-[100px] flex-1 items-center gap-1">
          <Search className="size-3 shrink-0 text-slate-400" />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            placeholder={selected.length === 0 ? placeholder : 'Search...'}
            className="w-full min-w-[60px] bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200 dark:placeholder:text-slate-500"
          />
        </div>
      </div>
      {/* Dropdown */}
      {open && (
        <div className={`absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto ${HIDE_SCROLL} rounded-xl border border-white/60 bg-white/95 shadow-xl shadow-slate-900/[0.08] backdrop-blur-2xl dark:border-slate-700/40 dark:bg-slate-900/95 dark:shadow-black/30`}>
          {filtered.length === 0 ? (
            <p className="px-3 py-3 text-center text-xs text-slate-400 dark:text-slate-500">
              {query ? 'No results found' : 'All items selected'}
            </p>
          ) : (
            filtered.map(item => {
              const id = getId(item)
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleSelect(id)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                >
                  {renderOption ? renderOption(item) : (
                    <span className="font-medium text-slate-700 dark:text-slate-200">{getLabel(item)}</span>
                  )}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Utilities ─── */

function getInitials(name: string) {
  return name.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2)
}

/* ─── Props ─── */

interface ExistingTask {
  pics: { id: string; name: string }[]
  startDate: string
  endDate: string
}

interface CreateActivityModalProps {
  open: boolean
  activityTypes: ActivityTypeOption[]
  users: UserOption[]
  reminderTemplates: ReminderTemplate[]
  waChannels?: { type: string; name: string }[]
  onClose: () => void
  onSubmit?: (form: CreateActivityForm) => void
  /** When provided, modal switches to edit mode with pre-populated fields */
  editData?: ActivityEditData | null
  /** Called when submitting in edit mode */
  onEdit?: (id: string, form: CreateActivityForm) => void
  /** Existing tasks for PIC conflict detection */
  existingTasks?: ExistingTask[]
}

/* ─── Component ─── */

export function CreateActivityModal({
  open,
  activityTypes,
  users,
  reminderTemplates,
  waChannels = [],
  onClose,
  onSubmit,
  editData,
  onEdit,
  existingTasks = [],
}: CreateActivityModalProps) {
  const isEditMode = !!editData
  /* ─── Form State ─── */
  const [name, setName] = useState('')
  const [typeId, setTypeId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [description, setDescription] = useState('')
  const [picIds, setPicIds] = useState<string[]>([])
  const [approverIds, setApproverIds] = useState<string[]>([])
  const [requiresBudget, setRequiresBudget] = useState(false)
  const [budget, setBudget] = useState('')
  const [budgetDate, setBudgetDate] = useState('')
  const [reminders, setReminders] = useState<ReminderConfig[]>([])
  const [budgetOpen, setBudgetOpen] = useState(false)

  const leaders = users.filter(u => u.role === 'Leader')
  const allMembers = users.filter(u => u.role !== 'Leader')

  /* ── Conflict warnings for selected PICs ── */
  const picConflicts = useMemo(() => {
    if (!startDate || !endDate || picIds.length === 0) return []
    const warnings: string[] = []
    for (const pId of picIds) {
      const picUser = users.find(u => u.id === pId)
      if (!picUser) continue
      const overlapping = existingTasks.filter(t =>
        t.pics.some(p => p.id === pId) &&
        t.startDate <= endDate && t.endDate >= startDate
      )
      if (overlapping.length > 0) {
        warnings.push(`${picUser.name} sudah punya ${overlapping.length} task di rentang tanggal ini`)
      }
    }
    return warnings
  }, [picIds, startDate, endDate, existingTasks, users])

  /* ─── Pre-populate for edit mode ─── */
  useEffect(() => {
    if (editData && open) {
      setName(editData.name)
      setTypeId(editData.activityType.id)
      setStartDate(editData.startDate)
      setEndDate(editData.endDate)
      setDescription(editData.description)
      setPicIds(editData.pics.map(p => p.id))
      setApproverIds(editData.approvers.map(a => a.id))
      setRequiresBudget(editData.requiresBudget)
      setBudget(editData.estimatedBudget?.toString() ?? '')
      setBudgetDate(editData.budgetNeededDate ?? '')
      setReminders(editData.reminders.map(r => ({
        id: r.id,
        trigger: r.trigger as ReminderTrigger,
        customDays: r.customDays ?? undefined,
        channel: r.channel as ReminderChannel,
        templateId: r.templateId ?? '',
        customMessage: r.customMessage ?? undefined,
        enabled: r.enabled,
      })))
      if (editData.requiresBudget) setBudgetOpen(true)
    } else if (!editData && open) {
      // Reset form for create mode
      setName('')
      setTypeId('')
      setStartDate('')
      setEndDate('')
      setDescription('')
      setPicIds([])
      setApproverIds([])
      setRequiresBudget(false)
      setBudget('')
      setBudgetDate('')
      setReminders([{
        id: `rem-${Date.now()}`,
        trigger: 'H-3',
        channel: waChannels[0]?.type ?? 'Marketing',
        templateId: reminderTemplates[0]?.id ?? '',
        enabled: true,
      }])
      setBudgetOpen(false)
    }
  }, [editData, open])

  /* ─── Handlers ─── */

  const togglePic = (id: string) => {
    setPicIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const toggleApprover = (id: string) => {
    setApproverIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const toggleType = (id: string) => {
    setTypeId(prev => prev === id ? '' : id)
  }

  const addReminder = () => {
    setReminders(prev => [
      ...prev,
      {
        id: `rem-${Date.now()}`,
        trigger: 'H-3',
        channel: waChannels[0]?.type ?? 'Marketing',
        templateId: reminderTemplates[0]?.id ?? '',
        enabled: true,
      },
    ])
  }

  const updateReminder = (id: string, patch: Partial<ReminderConfig>) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r))
  }

  const removeReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id))
  }

  const isCustomTemplate = (templateId: string) => {
    const tpl = reminderTemplates.find(t => t.id === templateId)
    return tpl?.name.toLowerCase().includes('custom') ?? false
  }

  const handleSubmit = () => {
    const formData: CreateActivityForm = {
      name,
      activityTypeId: typeId,
      startDate,
      endDate,
      description,
      picIds,
      approverIds,
      requiresBudget,
      estimatedBudget: requiresBudget && budget ? Number(budget) : null,
      budgetNeededDate: requiresBudget && budgetDate ? budgetDate : null,
      reminders,
    }
    if (isEditMode && editData) {
      onEdit?.(editData.id, formData)
    } else {
      onSubmit?.(formData)
    }
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center font-['Plus_Jakarta_Sans']">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative mx-4 flex max-h-[90vh] w-full max-w-xl flex-col rounded-3xl border border-white/60 bg-white/95 shadow-2xl shadow-slate-900/[0.12] backdrop-blur-2xl dark:border-slate-700/40 dark:bg-slate-900/95 dark:shadow-black/40">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200/40 px-6 py-4 dark:border-slate-700/30">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-md shadow-indigo-500/20">
              {isEditMode ? <Pencil className="size-4 text-white" /> : <Plus className="size-4 text-white" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">{isEditMode ? 'Edit Activity' : 'Create Activity'}</h2>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">{isEditMode ? 'Update activity details' : 'New activity for calendar planning'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100/60 hover:text-slate-600 dark:hover:bg-slate-800/40 dark:hover:text-slate-300"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className={`flex-1 overflow-y-auto ${HIDE_SCROLL} px-6 py-5`}>
          <div className="space-y-6">

            {/* ─── 1. Basic Information ─── */}
            <section>
              <div className="mb-3 flex items-center gap-2">
                <FileText className="size-4 text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Basic Information</h3>
              </div>
              <div className="space-y-3">
                {/* Activity Name */}
                <div>
                  <label className={LABEL}>Activity Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Launch Raya Campaign 2026"
                    className={INPUT}
                  />
                </div>
                {/* Activity Type — searchable tag (single select) */}
                <div>
                  <label className={LABEL}>Activity Type *</label>
                  <TagInput<ActivityTypeOption>
                    items={activityTypes}
                    selectedIds={typeId ? [typeId] : []}
                    onToggle={toggleType}
                    getId={at => at.id}
                    getLabel={at => at.name}
                    placeholder="Search activity type..."
                    multiple={false}
                    renderTag={(at, onRemove) => {
                      const cm = COLOR_MAP[at.color] ?? COLOR_MAP.indigo
                      return (
                        <span className={`flex items-center gap-1.5 rounded-lg px-2.5 py-0.5 text-xs font-semibold ${cm.tagBg} ${cm.tagText}`}>
                          <span className={`size-2 rounded-full ${cm.dot}`} />
                          {at.name}
                          <button type="button" onClick={onRemove} className="ml-0.5 opacity-60 hover:opacity-100"><X className="size-3" /></button>
                        </span>
                      )
                    }}
                    renderOption={(at) => {
                      const cm = COLOR_MAP[at.color] ?? COLOR_MAP.indigo
                      return (
                        <span className="flex items-center gap-2">
                          <span className={`size-2.5 rounded-full ${cm.dot}`} />
                          <span className="font-medium text-slate-700 dark:text-slate-200">{at.name}</span>
                        </span>
                      )
                    }}
                  />
                </div>
                {/* Timeline */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL}>Start Date *</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={INPUT} />
                  </div>
                  <div>
                    <label className={LABEL}>End Date *</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={INPUT} />
                  </div>
                </div>
                {/* PIC conflict warnings */}
                {picConflicts.length > 0 && (
                  <div className="space-y-1">
                    {picConflicts.map((msg, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-xl border border-amber-200/50 bg-amber-50/50 px-3 py-2 dark:border-amber-500/20 dark:bg-amber-500/5">
                        <AlertTriangle className="size-3.5 shrink-0 text-amber-500" />
                        <p className="text-[11px] font-medium text-amber-700 dark:text-amber-300">{msg}</p>
                      </div>
                    ))}
                  </div>
                )}
                {/* Description */}
                <div>
                  <label className={LABEL}>Description</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Brief context about this activity..."
                    rows={2}
                    className={`${INPUT} resize-none`}
                  />
                </div>
              </div>
            </section>

            {/* Separator */}
            <div className="h-px bg-gradient-to-r from-transparent via-slate-300/50 to-transparent dark:via-slate-600/30" />

            {/* ─── 2. Team Configuration ─── */}
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Users className="size-4 text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Team Configuration</h3>
              </div>
              <div className="space-y-3">
                {/* Activity PIC — searchable multi-tag */}
                <div>
                  <label className={LABEL}>Activity PIC</label>
                  <TagInput<UserOption>
                    items={allMembers}
                    selectedIds={picIds}
                    onToggle={togglePic}
                    getId={u => u.id}
                    getLabel={u => u.name}
                    placeholder="Search team members..."
                    renderTag={(u, onRemove) => (
                      <span className="flex items-center gap-1.5 rounded-lg bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                        <span className="flex size-4 items-center justify-center rounded bg-indigo-500 text-[7px] font-bold text-white">{getInitials(u.name)}</span>
                        {u.name}
                        <button type="button" onClick={onRemove} className="ml-0.5 text-indigo-400 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-200"><X className="size-3" /></button>
                      </span>
                    )}
                    renderOption={(u) => (
                      <span className="flex items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-500 text-[8px] font-bold text-white">{getInitials(u.name)}</span>
                        <span className="flex flex-col">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{u.name}</span>
                          <span className="text-[10px] text-slate-400">{u.role}</span>
                        </span>
                      </span>
                    )}
                  />
                </div>
                {/* Approver — searchable multi-tag (Leaders only) */}
                <div>
                  <label className={LABEL}>Approver (Leaders)</label>
                  <TagInput<UserOption>
                    items={leaders}
                    selectedIds={approverIds}
                    onToggle={toggleApprover}
                    getId={u => u.id}
                    getLabel={u => u.name}
                    placeholder="Search leaders..."
                    renderTag={(u, onRemove) => (
                      <span className="flex items-center gap-1.5 rounded-lg bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                        <span className="flex size-4 items-center justify-center rounded bg-amber-500 text-[7px] font-bold text-white">{getInitials(u.name)}</span>
                        {u.name}
                        <button type="button" onClick={onRemove} className="ml-0.5 text-amber-400 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-200"><X className="size-3" /></button>
                      </span>
                    )}
                    renderOption={(u) => (
                      <span className="flex items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded-md bg-gradient-to-br from-amber-500 to-orange-500 text-[8px] font-bold text-white">{getInitials(u.name)}</span>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{u.name}</span>
                      </span>
                    )}
                  />
                  <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">1 approve from any approver = task approved</p>
                </div>
              </div>
            </section>

            {/* Separator */}
            <div className="h-px bg-gradient-to-r from-transparent via-slate-300/50 to-transparent dark:via-slate-600/30" />

            {/* ─── 3. Budget (Collapsible) ─── */}
            <section>
              <button
                type="button"
                onClick={() => setBudgetOpen(!budgetOpen)}
                className="flex w-full items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <DollarSign className="size-4 text-indigo-500" />
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Budget</h3>
                  <span className="rounded-md bg-slate-200/50 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 dark:bg-slate-700/30 dark:text-slate-500">Optional</span>
                </div>
                {budgetOpen ? <ChevronUp className="size-4 text-slate-400" /> : <ChevronDown className="size-4 text-slate-400" />}
              </button>
              {budgetOpen && (
                <div className="mt-3 space-y-3">
                  <button
                    type="button"
                    onClick={() => {
                      const newValue = !requiresBudget
                      setRequiresBudget(newValue)
                      if (newValue) {
                        const hasFinance = reminders.some(r => r.channel === 'Marketing-Finance')
                        if (!hasFinance) {
                          setReminders(prev => [...prev, {
                            id: `rem-${Date.now()}`,
                            trigger: 'H-3',
                            channel: 'Marketing-Finance',
                            templateId: reminderTemplates[0]?.id ?? '',
                            enabled: true,
                          }])
                        }
                      }
                    }}
                    className="flex items-center gap-2 text-sm"
                  >
                    {requiresBudget
                      ? <ToggleRight className="size-5 text-indigo-500" />
                      : <ToggleLeft className="size-5 text-slate-400" />
                    }
                    <span className={`text-xs font-semibold ${requiresBudget ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
                      Requires Budget
                    </span>
                  </button>
                  {requiresBudget && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={LABEL}>Estimated Budget</label>
                        <input
                          type="number"
                          value={budget}
                          onChange={e => setBudget(e.target.value)}
                          placeholder="25000000"
                          className={INPUT}
                        />
                      </div>
                      <div>
                        <label className={LABEL}>Budget Needed Date</label>
                        <input type="date" value={budgetDate} onChange={e => setBudgetDate(e.target.value)} className={INPUT} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Separator */}
            <div className="h-px bg-gradient-to-r from-transparent via-slate-300/50 to-transparent dark:via-slate-600/30" />

            {/* ─── 4. Reminder Configuration ─── */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="size-4 text-indigo-500" />
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Reminders</h3>
                </div>
                <button
                  type="button"
                  onClick={addReminder}
                  className="flex items-center gap-1 rounded-lg bg-indigo-500/10 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 transition-all hover:bg-indigo-500/20 dark:bg-indigo-500/15 dark:text-indigo-400 dark:hover:bg-indigo-500/25"
                >
                  <Plus className="size-3" />
                  Add Reminder
                </button>
              </div>

              {reminders.length === 0 && (
                <p className="rounded-xl border border-dashed border-slate-200/50 bg-slate-50/40 py-4 text-center text-xs text-slate-400 dark:border-slate-700/30 dark:bg-slate-800/20 dark:text-slate-500">
                  No reminders configured. Click "Add Reminder" to set one up.
                </p>
              )}

              <div className="space-y-2.5">
                {reminders.map(rem => (
                  <div
                    key={rem.id}
                    className={`rounded-xl border px-3 py-2.5 transition-all ${
                      rem.enabled
                        ? 'border-slate-200/50 bg-white/50 dark:border-slate-700/40 dark:bg-slate-800/40'
                        : 'border-slate-200/30 bg-slate-50/30 opacity-60 dark:border-slate-700/20 dark:bg-slate-800/20'
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Trigger */}
                      <select
                        value={rem.trigger}
                        onChange={e => updateReminder(rem.id, { trigger: e.target.value as ReminderTrigger })}
                        className="rounded-lg border border-slate-200/50 bg-white/60 px-2 py-1.5 text-[11px] font-semibold text-slate-600 dark:border-slate-700/40 dark:bg-slate-800/40 dark:text-slate-300"
                      >
                        {TRIGGERS.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>

                      {rem.trigger === 'Custom' && (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={1}
                            value={rem.customDays ?? ''}
                            onChange={e => updateReminder(rem.id, { customDays: Number(e.target.value) })}
                            className="w-14 rounded-lg border border-slate-200/50 bg-white/60 px-2 py-1.5 text-center text-[11px] font-semibold dark:border-slate-700/40 dark:bg-slate-800/40 dark:text-slate-300"
                            placeholder="5"
                          />
                          <span className="text-[10px] text-slate-400">days before</span>
                        </div>
                      )}

                      {/* Channel */}
                      <select
                        value={rem.channel}
                        onChange={e => updateReminder(rem.id, { channel: e.target.value })}
                        className="rounded-lg border border-slate-200/50 bg-white/60 px-2 py-1.5 text-[11px] font-semibold text-slate-600 dark:border-slate-700/40 dark:bg-slate-800/40 dark:text-slate-300"
                      >
                        {waChannels.map(ch => (
                          <option key={ch.type} value={ch.type}>{ch.name}</option>
                        ))}
                        {waChannels.length === 0 && <option value="">No channels available</option>}
                      </select>

                      {/* Template */}
                      <select
                        value={rem.templateId}
                        onChange={e => updateReminder(rem.id, { templateId: e.target.value, customMessage: undefined })}
                        className="rounded-lg border border-slate-200/50 bg-white/60 px-2 py-1.5 text-[11px] font-semibold text-slate-600 dark:border-slate-700/40 dark:bg-slate-800/40 dark:text-slate-300"
                      >
                        {reminderTemplates.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>

                      <div className="ml-auto flex items-center gap-1">
                        <button type="button" onClick={() => updateReminder(rem.id, { enabled: !rem.enabled })}>
                          {rem.enabled
                            ? <ToggleRight className="size-4 text-indigo-500" />
                            : <ToggleLeft className="size-4 text-slate-400" />
                          }
                        </button>
                        <button
                          type="button"
                          onClick={() => removeReminder(rem.id)}
                          className="rounded-md p-1 text-slate-400 transition-colors hover:bg-rose-50/60 hover:text-rose-500 dark:hover:bg-rose-950/30"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Custom message textarea — shown when Custom Template is selected */}
                    {isCustomTemplate(rem.templateId) && (
                      <div className="mt-2">
                        <textarea
                          value={rem.customMessage ?? ''}
                          onChange={e => updateReminder(rem.id, { customMessage: e.target.value })}
                          placeholder="Write your custom reminder message..."
                          rows={3}
                          className="w-full resize-none rounded-lg border border-slate-200/50 bg-white/60 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300/30 dark:border-slate-700/40 dark:bg-slate-800/40 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-indigo-500/50 dark:focus:ring-indigo-500/20"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200/40 px-6 py-4 dark:border-slate-700/30">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200/50 bg-white/50 px-4 py-2.5 text-sm font-semibold text-slate-600 backdrop-blur-sm transition-all hover:bg-white/80 dark:border-slate-700/40 dark:bg-slate-800/40 dark:text-slate-300 dark:hover:bg-slate-800/60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:shadow-indigo-500/30"
          >
            {isEditMode ? 'Save Changes' : 'Create Activity'}
          </button>
        </div>
      </div>
    </div>
  )
}
