/** User role */
export type UserRole = 'Leader' | 'PIC'

/** User account status */
export type UserStatus = 'Active' | 'Deactivated'

/** WhatsApp group type */
export type WhatsappGroupType = 'Marketing' | 'Marketing-Finance'

/** Connection status */
export type ConnectionStatus = 'Connected' | 'Disconnected'

/** Settings tab */
export type SettingsTab = 'profile' | 'users' | 'whatsapp'

/** Current logged-in user */
export interface CurrentUser {
  id: string
  name: string
  role: UserRole
  isSuperAdmin: boolean
}

/** Notification preference toggles */
export interface NotificationPreferences {
  taskAssignment: boolean
  approval: boolean
  revision: boolean
  reassignment: boolean
  deadlineAlert: boolean
}

/** User's editable profile data */
export interface ProfileData {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  role: UserRole
  isSuperAdmin: boolean
  notificationPreferences: NotificationPreferences
}

/** Profile update form data */
export interface ProfileFormData {
  name: string
  email: string
  avatarUrl: string | null
  notificationPreferences: NotificationPreferences
}

/** A team member in the user management table */
export interface TeamMember {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  role: UserRole
  isSuperAdmin: boolean
  status: UserStatus
  lastActiveAt: string
}

/** Invite/edit user form data */
export interface UserFormData {
  name: string
  email: string
  role: UserRole
  isSuperAdmin: boolean
}

/** WhatsApp Business API config (display — credentials are masked) */
export interface WhatsappAccount {
  /** Masked API key — only last 4 chars visible (e.g., "••••••••3f7a"). Full value never returned from server */
  apiKey: string
  phoneNumber: string
  connectionStatus: ConnectionStatus
  lastTestedAt: string
}

/** WhatsApp API form data */
export interface WhatsappAccountFormData {
  apiKey: string
  phoneNumber: string
}

/** A registered WhatsApp group (display — group ID is masked) */
export interface WhatsappGroup {
  id: string
  name: string
  /** Masked group ID — only last 4 chars visible. Full value never returned from server */
  groupId: string
  type: WhatsappGroupType
  memberCount: number
  lastMessageSentAt: string | null
  connectionStatus: ConnectionStatus
}

/** WhatsApp group form data */
export interface WhatsappGroupFormData {
  name: string
  groupId: string
  type: WhatsappGroupType
}

/** A message template */
export interface MessageTemplate {
  id: string
  name: string
  body: string
  placeholders: string[]
  usedByCount: number
  createdAt: string
}

/** Message template form data */
export interface MessageTemplateFormData {
  name: string
  body: string
}

/** Available placeholder for template editor */
export interface PlaceholderOption {
  key: string
  label: string
  example: string
}

/** Settings section props */
export interface SettingsProps {
  currentUser: CurrentUser
  activeTab: SettingsTab
  profileData: ProfileData
  teamMembers: TeamMember[]
  whatsappAccount: WhatsappAccount
  whatsappGroups: WhatsappGroup[]
  messageTemplates: MessageTemplate[]
  availablePlaceholders: PlaceholderOption[]

  /** Called when user switches tabs */
  onTabChange?: (tab: SettingsTab) => void

  /* Profile */
  /** Called when user saves profile changes */
  onProfileUpdate?: (data: ProfileFormData) => void

  /* User Management */
  /** Called when leader invites a new user */
  onUserInvite?: (data: UserFormData) => void
  /** Called when leader updates a user */
  onUserUpdate?: (userId: string, data: UserFormData) => void
  /** Called when leader deactivates a user */
  onUserDeactivate?: (userId: string) => void
  /** Called when leader reactivates a user */
  onUserReactivate?: (userId: string) => void

  /* WhatsApp Config */
  /** Called when Super Admin saves API credentials */
  onWhatsappAccountUpdate?: (data: WhatsappAccountFormData) => void
  /** Called when Super Admin tests WhatsApp connection */
  onWhatsappTestConnection?: () => void
  /** Called when Super Admin adds a WhatsApp group */
  onWhatsappGroupCreate?: (data: WhatsappGroupFormData) => void
  /** Called when Super Admin updates a WhatsApp group */
  onWhatsappGroupUpdate?: (groupId: string, data: WhatsappGroupFormData) => void
  /** Called when Super Admin removes a WhatsApp group */
  onWhatsappGroupDelete?: (groupId: string) => void
  /** Called when Super Admin creates a message template */
  onTemplateCreate?: (data: MessageTemplateFormData) => void
  /** Called when Super Admin updates a message template */
  onTemplateUpdate?: (templateId: string, data: MessageTemplateFormData) => void
  /** Called when Super Admin deletes a message template */
  onTemplateDelete?: (templateId: string) => void
}
