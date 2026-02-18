import { useState, useRef } from 'react'
import {
  Plus, X, Trash2, AlertTriangle, Palette,
  Megaphone, Users, CalendarCheck, Camera, Handshake, PenLine,
  Sparkles, Rocket, Target, Gift, Mic, Video, Globe, Heart, Zap,
  type LucideIcon,
} from 'lucide-react'
import type {
  ActivityTypeProps, ActivityType, ActivityTypeFormData,
} from '@/types/activityType'

/* ── Icon registry ── */

const ICON_MAP: Record<string, LucideIcon> = {
  megaphone: Megaphone, users: Users, 'calendar-check': CalendarCheck, camera: Camera,
  handshake: Handshake, 'pen-line': PenLine, sparkles: Sparkles, rocket: Rocket,
  target: Target, gift: Gift, mic: Mic, video: Video, globe: Globe, heart: Heart, zap: Zap,
}

/* ── Color helpers ── */

const hexToRgba = (hex: string, a: number) => {
  const c = hex.replace('#', '')
  const r = parseInt(c.substring(0, 2), 16) || 0
  const g = parseInt(c.substring(2, 4), 16) || 0
  const b = parseInt(c.substring(4, 6), 16) || 0
  return `rgba(${r},${g},${b},${a})`
}

const darken = (hex: string, pct = 0.2) => {
  const c = hex.replace('#', '')
  const r = Math.max(0, Math.round((parseInt(c.substring(0, 2), 16) || 0) * (1 - pct)))
  const g = Math.max(0, Math.round((parseInt(c.substring(2, 4), 16) || 0) * (1 - pct)))
  const b = Math.max(0, Math.round((parseInt(c.substring(4, 6), 16) || 0) * (1 - pct)))
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
}

const isValidHex = (s: string) => /^#[0-9a-fA-F]{6}$/.test(s)

const INPUT = 'w-full rounded-xl border border-slate-200/50 bg-white/50 px-3 py-2.5 text-sm text-slate-700 backdrop-blur-sm transition-all placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300/30 dark:border-slate-700/40 dark:bg-slate-800/40 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-indigo-500/50'
const LABEL = 'mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400'

/* ================================================================
   ActivityTypeView Component
   ================================================================ */

export function ActivityTypeView({
  currentUser, activityTypes, colorOptions, iconOptions,
  onCreate, onUpdate, onDelete, onSelect,
}: ActivityTypeProps) {

  const isLeader = currentUser.role === 'Leader'
  const [panelMode, setPanelMode] = useState<'create' | 'edit' | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<ActivityType | null>(null)

  // Form state
  const [formName, setFormName] = useState('')
  const [formColor, setFormColor] = useState('#6366f1')
  const [formIcon, setFormIcon] = useState<string | null>(null)
  const [hexInput, setHexInput] = useState('6366f1')
  const colorRef = useRef<HTMLInputElement>(null)

  const updateColor = (hex: string) => {
    const normalized = hex.startsWith('#') ? hex : '#' + hex
    setFormColor(normalized)
    setHexInput(normalized.replace('#', ''))
  }

  /* ── Handlers ── */

  const openCreate = () => {
    setFormName(''); updateColor('#6366f1'); setFormIcon(null)
    setPanelMode('create'); setEditId(null)
  }

  const openEdit = (at: ActivityType) => {
    setFormName(at.name); updateColor(at.color); setFormIcon(at.icon)
    setEditId(at.id); setPanelMode('edit')
    onSelect?.(at.id)
  }

  const closePanel = () => { setPanelMode(null); setEditId(null) }

  const handleSave = () => {
    if (!formName.trim()) return
    const data: ActivityTypeFormData = { name: formName.trim(), color: formColor, icon: formIcon }
    if (panelMode === 'create') onCreate?.(data)
    else if (panelMode === 'edit' && editId) onUpdate?.(editId, data)
    closePanel()
  }

  const handleDelete = () => {
    if (!editId) return
    const at = activityTypes.find(a => a.id === editId)
    if (at && at.usedByCount > 0) {
      setDeleteConfirm(at)
    } else {
      onDelete?.(editId)
      closePanel()
    }
  }

  const confirmDelete = () => {
    if (deleteConfirm) {
      onDelete?.(deleteConfirm.id)
      setDeleteConfirm(null)
      closePanel()
    }
  }

  return (
    <div className="relative flex h-full flex-col font-['Plus_Jakarta_Sans']">

      {/* ─── Header ─── */}
      <div className="shrink-0 px-4 pt-4 lg:px-6 lg:pt-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">Activity Types</h1>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{activityTypes.length} type{activityTypes.length !== 1 ? 's' : ''} defined</p>
          </div>
          {isLeader && (
            <button onClick={openCreate} className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:shadow-indigo-500/30">
              <Plus className="size-3.5" />Add Activity Type
            </button>
          )}
        </div>
      </div>

      {/* ─── Grid ─── */}
      <div className="flex-1 overflow-y-auto p-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:px-6 lg:pb-6">
        {activityTypes.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200/60 py-20 dark:border-slate-700/30">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-500/15 dark:to-violet-500/15">
              <Sparkles className="size-7 text-indigo-500" />
            </div>
            <h3 className="mt-4 text-sm font-bold text-slate-700 dark:text-slate-200">No activity types yet</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Create your first activity type to color-code your activities.</p>
            {isLeader && (
              <button onClick={openCreate} className="mt-4 flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25">
                <Plus className="size-3.5" />Create First Type
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {activityTypes.map(at => {
              const IconComp = at.icon ? ICON_MAP[at.icon] ?? null : null
              return (
                <button
                  key={at.id}
                  onClick={() => isLeader ? openEdit(at) : onSelect?.(at.id)}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-white/60 bg-white/80 text-left shadow-sm transition-all hover:bg-white/95 hover:shadow-md dark:border-slate-700/40 dark:bg-slate-800/60 dark:hover:bg-slate-800/80"
                >
                  {/* Color strip */}
                  <div className="h-2 w-full" style={{ background: `linear-gradient(to right, ${at.color}, ${darken(at.color)})` }} />
                  {/* Content */}
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex size-10 items-center justify-center rounded-xl" style={{ backgroundColor: hexToRgba(at.color, 0.1) }}>
                        {IconComp
                          ? <IconComp className="size-5" style={{ color: at.color }} />
                          : <div className="size-4 rounded-full" style={{ backgroundColor: at.color }} />}
                      </div>
                    </div>
                    <h3 className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">{at.name}</h3>
                    <span className="mt-1.5 inline-flex w-fit items-center rounded-lg bg-slate-100/60 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-700/30 dark:text-slate-400">
                      {at.usedByCount} activit{at.usedByCount === 1 ? 'y' : 'ies'}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ─── Side Panel (Create / Edit) ─── */}
      {panelMode && (
        <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md lg:absolute lg:inset-y-0 lg:right-0 lg:w-[380px]">
          <div className="flex-1 bg-slate-900/20 backdrop-blur-sm lg:hidden" onClick={closePanel} />
          <div className="flex w-[340px] flex-col border-l border-white/60 bg-white/95 backdrop-blur-2xl lg:w-full dark:border-slate-700/40 dark:bg-slate-900/95" style={{ boxShadow: '-4px 0 24px rgba(0,0,0,0.06)' }}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200/40 px-5 py-3 dark:border-slate-700/30">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg shadow-sm" style={{ background: `linear-gradient(135deg, ${formColor}, ${darken(formColor)})` }}>
                  {panelMode === 'create' ? <Plus className="size-3.5 text-white" /> : <PenLine className="size-3 text-white" />}
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{panelMode === 'create' ? 'New Activity Type' : 'Edit Activity Type'}</h3>
              </div>
              <button onClick={closePanel} className="rounded-lg p-1 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"><X className="size-4" /></button>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto p-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="space-y-5">
                {/* Name */}
                <div>
                  <label className={LABEL}>Name *</label>
                  <input type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. IG Campaign" className={INPUT} />
                </div>

                {/* ── Color Picker ── */}
                <div>
                  <label className={LABEL}>Color</label>

                  {/* Color well + Hex input row */}
                  <div className="flex items-center gap-3">
                    {/* Native color picker trigger */}
                    <button
                      type="button"
                      onClick={() => colorRef.current?.click()}
                      className="relative flex size-11 shrink-0 items-center justify-center rounded-xl border-2 border-white shadow-md transition-transform hover:scale-105 dark:border-slate-600"
                      style={{ backgroundColor: formColor }}
                    >
                      <Palette className="size-4 text-white/80 drop-shadow-sm" />
                      <input
                        ref={colorRef}
                        type="color"
                        value={formColor}
                        onChange={e => updateColor(e.target.value)}
                        className="absolute inset-0 cursor-pointer opacity-0"
                        tabIndex={-1}
                      />
                    </button>

                    {/* Hex input */}
                    <div className="flex flex-1 items-center">
                      <span className="rounded-l-xl border border-r-0 border-slate-200/50 bg-slate-50/80 px-2.5 py-2.5 text-xs font-bold text-slate-400 dark:border-slate-700/40 dark:bg-slate-800/60 dark:text-slate-500">#</span>
                      <input
                        type="text"
                        value={hexInput}
                        onChange={e => {
                          const raw = e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6)
                          setHexInput(raw)
                          if (raw.length === 6 && isValidHex('#' + raw)) setFormColor('#' + raw)
                        }}
                        onBlur={() => setHexInput(formColor.replace('#', ''))}
                        placeholder="6366f1"
                        maxLength={6}
                        className="w-full rounded-r-xl border border-slate-200/50 bg-white/50 px-2.5 py-2.5 font-mono text-xs tracking-wider text-slate-700 backdrop-blur-sm transition-all placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300/30 dark:border-slate-700/40 dark:bg-slate-800/40 dark:text-slate-200"
                      />
                    </div>
                  </div>

                  {/* Preset swatches */}
                  <div className="mt-3">
                    <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Presets</span>
                    <div className="flex flex-wrap gap-2">
                      {colorOptions.map(co => {
                        const active = formColor.toLowerCase() === co.value.toLowerCase()
                        return (
                          <button
                            key={co.value}
                            type="button"
                            onClick={() => updateColor(co.value)}
                            title={co.name}
                            className={`size-7 rounded-full border-2 shadow-sm transition-all hover:scale-110 ${active ? 'scale-110 border-slate-700 ring-2 ring-offset-1 dark:border-white dark:ring-offset-slate-900' : 'border-white/80 dark:border-slate-600/50'}`}
                            style={{ backgroundColor: co.value, ...(active ? { ringColor: co.value } : {}) }}
                          />
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* ── Icon Picker ── */}
                <div>
                  <label className={LABEL}>Icon (optional)</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {/* No icon option */}
                    <button
                      type="button"
                      onClick={() => setFormIcon(null)}
                      className={`flex size-10 items-center justify-center rounded-xl transition-all ${formIcon === null ? 'bg-indigo-100 ring-2 ring-indigo-500 ring-offset-1 dark:bg-indigo-500/15 dark:ring-offset-slate-900' : 'border border-slate-200/50 bg-white/50 hover:bg-slate-50/60 dark:border-slate-700/40 dark:bg-slate-800/40 dark:hover:bg-slate-800/60'}`}
                    >
                      <X className="size-3.5 text-slate-400" />
                    </button>
                    {iconOptions.map(iconName => {
                      const Icon = ICON_MAP[iconName]
                      if (!Icon) return null
                      const active = formIcon === iconName
                      return (
                        <button
                          key={iconName}
                          type="button"
                          onClick={() => setFormIcon(iconName)}
                          className={`flex size-10 items-center justify-center rounded-xl transition-all ${active ? 'bg-indigo-100 ring-2 ring-indigo-500 ring-offset-1 dark:bg-indigo-500/15 dark:ring-offset-slate-900' : 'border border-slate-200/50 bg-white/50 hover:bg-slate-50/60 dark:border-slate-700/40 dark:bg-slate-800/40 dark:hover:bg-slate-800/60'}`}
                        >
                          <Icon className={`size-4 ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`} />
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* ── Live Preview ── */}
                <div>
                  <label className={LABEL}>Preview</label>
                  {(() => {
                    const IconComp = formIcon ? ICON_MAP[formIcon] ?? null : null
                    return (
                      <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/80 shadow-sm dark:border-slate-700/40 dark:bg-slate-800/60">
                        <div className="h-2 w-full" style={{ background: `linear-gradient(to right, ${formColor}, ${darken(formColor)})` }} />
                        <div className="p-4">
                          <div className="flex size-10 items-center justify-center rounded-xl" style={{ backgroundColor: hexToRgba(formColor, 0.1) }}>
                            {IconComp
                              ? <IconComp className="size-5" style={{ color: formColor }} />
                              : <div className="size-4 rounded-full" style={{ backgroundColor: formColor }} />}
                          </div>
                          <p className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-200">{formName || 'Activity Type Name'}</p>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-200/40 px-5 py-3 dark:border-slate-700/30">
              <div>
                {panelMode === 'edit' && (
                  <button onClick={handleDelete} className="flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold text-rose-500 transition-all hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10">
                    <Trash2 className="size-3.5" />Delete
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={closePanel} className="rounded-xl border border-slate-200/50 bg-white/50 px-4 py-2 text-xs font-semibold text-slate-600 backdrop-blur-sm transition-all hover:bg-white/80 dark:border-slate-700/40 dark:bg-slate-800/40 dark:text-slate-300">Cancel</button>
                <button onClick={handleSave} disabled={!formName.trim()} className="rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl disabled:opacity-40">
                  {panelMode === 'create' ? 'Create' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Dialog ─── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-white/60 bg-white/95 p-6 shadow-2xl backdrop-blur-2xl dark:border-slate-700/40 dark:bg-slate-900/95">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-500/15">
              <AlertTriangle className="size-6 text-rose-500" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-800 dark:text-slate-100">Delete &ldquo;{deleteConfirm.name}&rdquo;?</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              This activity type is used by <span className="font-semibold text-slate-700 dark:text-slate-200">{deleteConfirm.usedByCount} activit{deleteConfirm.usedByCount === 1 ? 'y' : 'ies'}</span>. Deleting it will remove the color coding from those activities. Are you sure?
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="rounded-xl border border-slate-200/50 bg-white/50 px-4 py-2 text-xs font-semibold text-slate-600 transition-all hover:bg-white/80 dark:border-slate-700/40 dark:bg-slate-800/40 dark:text-slate-300">Cancel</button>
              <button onClick={confirmDelete} className="rounded-xl bg-rose-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-rose-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
