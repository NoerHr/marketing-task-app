import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Map hex color values from the API to Tailwind color names used by view components */
const HEX_TO_NAME: Record<string, string> = {
  '#f43f5e': 'rose',
  '#ec4899': 'pink',
  '#8b5cf6': 'violet',
  '#6366f1': 'indigo',
  '#0ea5e9': 'sky',
  '#14b8a6': 'teal',
  '#10b981': 'emerald',
  '#f59e0b': 'amber',
  '#f97316': 'orange',
  '#ef4444': 'red',
}

export function hexToColorName(hex: string): string {
  return HEX_TO_NAME[hex?.toLowerCase()] ?? hex
}

/** Human-friendly relative time string (e.g. "5m ago", "2h ago", "3d ago") */
export function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const seconds = Math.floor((now - then) / 1000)

  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}
