import type {
  CurrentUser,
  ProfileData,
  TeamMember,
  WhatsappAccount,
  WhatsappGroup,
  MessageTemplate,
  PlaceholderOption,
} from '@/types/settings'

export const currentUser: CurrentUser = {
  id: 'usr-001',
  name: 'Alex Morgan',
  role: 'Leader',
  isSuperAdmin: true,
}

export const profileData: ProfileData = {
  id: 'usr-001',
  name: 'Alex Morgan',
  email: 'alex.morgan@company.com',
  avatarUrl: null,
  role: 'Leader',
  isSuperAdmin: true,
  notificationPreferences: {
    taskAssignment: true,
    approval: true,
    revision: true,
    reassignment: true,
    deadlineAlert: true,
  },
}

export const teamMembers: TeamMember[] = [
  {
    id: 'usr-001',
    name: 'Alex Morgan',
    email: 'alex.morgan@company.com',
    avatarUrl: null,
    role: 'Leader',
    isSuperAdmin: true,
    status: 'Active',
    lastActiveAt: '2026-02-16T14:30:00Z',
  },
  {
    id: 'usr-002',
    name: 'Dina Rahma',
    email: 'dina.rahma@company.com',
    avatarUrl: null,
    role: 'PIC',
    isSuperAdmin: false,
    status: 'Active',
    lastActiveAt: '2026-02-16T12:15:00Z',
  },
  {
    id: 'usr-003',
    name: 'Rafi Pratama',
    email: 'rafi.pratama@company.com',
    avatarUrl: null,
    role: 'PIC',
    isSuperAdmin: false,
    status: 'Active',
    lastActiveAt: '2026-02-16T09:45:00Z',
  },
  {
    id: 'usr-004',
    name: 'Sarah Putri',
    email: 'sarah.putri@company.com',
    avatarUrl: null,
    role: 'PIC',
    isSuperAdmin: false,
    status: 'Active',
    lastActiveAt: '2026-02-15T17:00:00Z',
  },
  {
    id: 'usr-005',
    name: 'Michael Tan',
    email: 'michael.tan@company.com',
    avatarUrl: null,
    role: 'PIC',
    isSuperAdmin: false,
    status: 'Active',
    lastActiveAt: '2026-02-16T11:30:00Z',
  },
  {
    id: 'usr-006',
    name: 'Ayu Lestari',
    email: 'ayu.lestari@company.com',
    avatarUrl: null,
    role: 'PIC',
    isSuperAdmin: false,
    status: 'Active',
    lastActiveAt: '2026-02-14T16:20:00Z',
  },
  {
    id: 'usr-007',
    name: 'Budi Santoso',
    email: 'budi.santoso@company.com',
    avatarUrl: null,
    role: 'PIC',
    isSuperAdmin: false,
    status: 'Deactivated',
    lastActiveAt: '2026-01-20T10:00:00Z',
  },
]

export const whatsappAccount: WhatsappAccount = {
  apiKey: 'waba_sk_\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u20223f7a',
  phoneNumber: '+62 812-3456-7890',
  connectionStatus: 'Connected',
  lastTestedAt: '2026-02-15T08:00:00Z',
}

export const whatsappGroups: WhatsappGroup[] = [
  {
    id: 'wg-001',
    name: 'Marketing Team Updates',
    groupId: '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u20227890@g.us',
    type: 'Marketing',
    memberCount: 12,
    lastMessageSentAt: '2026-02-16T08:00:00Z',
    connectionStatus: 'Connected',
  },
  {
    id: 'wg-002',
    name: 'Marketing-Finance Coordination',
    groupId: '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u20223210@g.us',
    type: 'Marketing-Finance',
    memberCount: 8,
    lastMessageSentAt: '2026-02-14T10:30:00Z',
    connectionStatus: 'Connected',
  },
]

export const messageTemplates: MessageTemplate[] = [
  {
    id: 'mt-001',
    name: 'Task Deadline Reminder',
    body: 'Reminder: Task "{{task_name}}" for activity "{{activity_name}}" is due on {{deadline}}. Please ensure it\'s completed on time. PIC: {{pic_name}}',
    placeholders: ['task_name', 'activity_name', 'deadline', 'pic_name'],
    usedByCount: 8,
    createdAt: '2025-12-01T10:00:00Z',
  },
  {
    id: 'mt-002',
    name: 'Activity Budget Alert',
    body: 'Budget update for "{{activity_name}}": The deadline is approaching on {{deadline}}. Please review budget allocation and ensure all expenses are submitted. Contact {{pic_name}} for details.',
    placeholders: ['activity_name', 'deadline', 'pic_name'],
    usedByCount: 3,
    createdAt: '2025-12-15T14:00:00Z',
  },
  {
    id: 'mt-003',
    name: 'Day-Of Reminder',
    body: 'Today is the day! "{{task_name}}" under "{{activity_name}}" is due today. {{pic_name}}, please make sure everything is wrapped up.',
    placeholders: ['task_name', 'activity_name', 'pic_name'],
    usedByCount: 5,
    createdAt: '2026-01-10T09:00:00Z',
  },
  {
    id: 'mt-004',
    name: 'Event Preparation Notice',
    body: 'Heads up! The event "{{activity_name}}" is happening on {{deadline}}. All tasks should be finalized. PIC team: {{pic_name}} \u2014 please confirm readiness.',
    placeholders: ['activity_name', 'deadline', 'pic_name'],
    usedByCount: 2,
    createdAt: '2026-01-20T11:30:00Z',
  },
  {
    id: 'mt-005',
    name: 'Custom Follow-up',
    body: 'Follow-up on "{{task_name}}" \u2014 this task is overdue. {{pic_name}}, please provide a status update for "{{activity_name}}" as soon as possible.',
    placeholders: ['task_name', 'pic_name', 'activity_name'],
    usedByCount: 0,
    createdAt: '2026-02-05T08:00:00Z',
  },
]

export const availablePlaceholders: PlaceholderOption[] = [
  { key: 'activity_name', label: 'Activity Name', example: 'Ramadan Campaign 2026' },
  { key: 'task_name', label: 'Task Name', example: 'Final edit product video' },
  { key: 'deadline', label: 'Deadline', example: 'Feb 20, 2026' },
  { key: 'pic_name', label: 'PIC Name', example: 'Dina Rahma' },
]
