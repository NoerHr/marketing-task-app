/** User role */
export type UserRole = 'Leader' | 'PIC'

/** Current logged-in user */
export interface CurrentUser {
  id: string
  name: string
  role: UserRole
  isSuperAdmin: boolean
}

/** An activity type record */
export interface ActivityType {
  id: string
  name: string
  color: string
  icon: string | null
  usedByCount: number
  createdAt: string
}

/** A selectable color option for the picker */
export interface ColorOption {
  name: string
  value: string
}

/** Create/edit form data */
export interface ActivityTypeFormData {
  name: string
  color: string
  icon: string | null
}

/** Activity Type section props */
export interface ActivityTypeProps {
  currentUser: CurrentUser
  activityTypes: ActivityType[]
  colorOptions: ColorOption[]
  iconOptions: string[]

  /** Called when leader creates a new activity type */
  onCreate?: (data: ActivityTypeFormData) => void
  /** Called when leader updates an existing activity type */
  onUpdate?: (id: string, data: ActivityTypeFormData) => void
  /** Called when leader deletes an activity type (after confirmation) */
  onDelete?: (id: string) => void
  /** Called when user clicks a card to view/edit details */
  onSelect?: (id: string) => void
}
