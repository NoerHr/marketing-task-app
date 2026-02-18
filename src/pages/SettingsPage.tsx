import { useState, useEffect, useCallback } from 'react'
import { SettingsView } from '@/components/settings'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import type {
  SettingsTab,
  ProfileData,
  ProfileFormData,
  TeamMember,
  UserFormData,
  WhatsappAccount,
  WhatsappAccountFormData,
  WhatsappGroup,
  WhatsappGroupFormData,
  MessageTemplate,
  MessageTemplateFormData,
  PlaceholderOption,
} from '@/types/settings'

export default function SettingsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [loading, setLoading] = useState(true)

  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [whatsappAccount, setWhatsappAccount] = useState<WhatsappAccount>({
    apiKey: '', phoneNumber: '', connectionStatus: 'Disconnected', lastTestedAt: '',
  })
  const [whatsappGroups, setWhatsappGroups] = useState<WhatsappGroup[]>([])
  const [messageTemplates, setMessageTemplates] = useState<MessageTemplate[]>([])
  const [availablePlaceholders, setAvailablePlaceholders] = useState<PlaceholderOption[]>([])

  const currentUser = user
    ? { id: user.id, name: user.name, role: user.role as 'Leader' | 'PIC', isSuperAdmin: user.isSuperAdmin }
    : { id: '', name: '', role: 'PIC' as const, isSuperAdmin: false }

  const fetchAll = useCallback(async () => {
    try {
      const [meRes, usersRes, waAccountRes, waGroupsRes, templatesRes, placeholdersRes] = await Promise.all([
        api.get<ProfileData>('/api/me'),
        api.get<TeamMember[]>('/api/users'),
        api.get<WhatsappAccount>('/api/whatsapp/account').catch(() => ({
          apiKey: '', phoneNumber: '', connectionStatus: 'Disconnected' as const, lastTestedAt: '',
        })),
        api.get<WhatsappGroup[]>('/api/whatsapp/groups').catch(() => []),
        api.get<MessageTemplate[]>('/api/message-templates').catch(() => []),
        api.get<PlaceholderOption[]>('/api/message-templates/placeholders').catch(() => []),
      ])

      setProfileData(meRes)
      setTeamMembers(Array.isArray(usersRes) ? usersRes : [])
      setWhatsappAccount(waAccountRes)
      setWhatsappGroups(Array.isArray(waGroupsRes) ? waGroupsRes : [])
      setMessageTemplates(Array.isArray(templatesRes) ? templatesRes : [])
      setAvailablePlaceholders(Array.isArray(placeholdersRes) ? placeholdersRes : [])
    } catch (err) {
      console.error('Failed to load settings data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  if (loading || !profileData) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <SettingsView
      currentUser={currentUser}
      activeTab={activeTab}
      profileData={profileData}
      teamMembers={teamMembers}
      whatsappAccount={whatsappAccount}
      whatsappGroups={whatsappGroups}
      messageTemplates={messageTemplates}
      availablePlaceholders={availablePlaceholders}
      onTabChange={(tab) => setActiveTab(tab)}
      onProfileUpdate={async (data: ProfileFormData) => {
        try {
          await api.patch('/api/me', data)
          const updated = await api.get<ProfileData>('/api/me')
          setProfileData(updated)
        } catch (err) {
          console.error('Failed to update profile:', err)
        }
      }}
      onUserInvite={async (data: UserFormData) => {
        try {
          await api.post('/api/users/invite', data)
          const updated = await api.get<TeamMember[]>('/api/users')
          setTeamMembers(Array.isArray(updated) ? updated : [])
        } catch (err) {
          console.error('Failed to invite user:', err)
        }
      }}
      onUserUpdate={async (userId: string, data: UserFormData) => {
        try {
          await api.patch(`/api/users/${userId}`, data)
          const updated = await api.get<TeamMember[]>('/api/users')
          setTeamMembers(Array.isArray(updated) ? updated : [])
        } catch (err) {
          console.error('Failed to update user:', err)
        }
      }}
      onUserDeactivate={async (userId: string) => {
        try {
          await api.post(`/api/users/${userId}/deactivate`)
          const updated = await api.get<TeamMember[]>('/api/users')
          setTeamMembers(Array.isArray(updated) ? updated : [])
        } catch (err) {
          console.error('Failed to deactivate user:', err)
        }
      }}
      onUserReactivate={async (userId: string) => {
        try {
          await api.post(`/api/users/${userId}/reactivate`)
          const updated = await api.get<TeamMember[]>('/api/users')
          setTeamMembers(Array.isArray(updated) ? updated : [])
        } catch (err) {
          console.error('Failed to reactivate user:', err)
        }
      }}
      onWhatsappAccountUpdate={async (data: WhatsappAccountFormData) => {
        try {
          await api.put('/api/whatsapp/account', data)
          const updated = await api.get<WhatsappAccount>('/api/whatsapp/account')
          setWhatsappAccount(updated)
        } catch (err) {
          console.error('Failed to update WhatsApp account:', err)
        }
      }}
      onWhatsappTestConnection={async () => {
        try {
          await api.post('/api/whatsapp/test')
          const updated = await api.get<WhatsappAccount>('/api/whatsapp/account')
          setWhatsappAccount(updated)
        } catch (err) {
          console.error('Failed to test WhatsApp connection:', err)
        }
      }}
      onWhatsappGroupCreate={async (data: WhatsappGroupFormData) => {
        try {
          await api.post('/api/whatsapp/groups', data)
          const updated = await api.get<WhatsappGroup[]>('/api/whatsapp/groups')
          setWhatsappGroups(Array.isArray(updated) ? updated : [])
        } catch (err) {
          console.error('Failed to create WhatsApp group:', err)
        }
      }}
      onWhatsappGroupUpdate={async (groupId: string, data: WhatsappGroupFormData) => {
        try {
          await api.patch(`/api/whatsapp/groups/${groupId}`, data)
          const updated = await api.get<WhatsappGroup[]>('/api/whatsapp/groups')
          setWhatsappGroups(Array.isArray(updated) ? updated : [])
        } catch (err) {
          console.error('Failed to update WhatsApp group:', err)
        }
      }}
      onWhatsappGroupDelete={async (groupId: string) => {
        try {
          await api.del(`/api/whatsapp/groups/${groupId}`)
          const updated = await api.get<WhatsappGroup[]>('/api/whatsapp/groups')
          setWhatsappGroups(Array.isArray(updated) ? updated : [])
        } catch (err) {
          console.error('Failed to delete WhatsApp group:', err)
        }
      }}
      onTemplateCreate={async (data: MessageTemplateFormData) => {
        try {
          await api.post('/api/message-templates', data)
          const updated = await api.get<MessageTemplate[]>('/api/message-templates')
          setMessageTemplates(Array.isArray(updated) ? updated : [])
        } catch (err) {
          console.error('Failed to create template:', err)
        }
      }}
      onTemplateUpdate={async (templateId: string, data: MessageTemplateFormData) => {
        try {
          await api.patch(`/api/message-templates/${templateId}`, data)
          const updated = await api.get<MessageTemplate[]>('/api/message-templates')
          setMessageTemplates(Array.isArray(updated) ? updated : [])
        } catch (err) {
          console.error('Failed to update template:', err)
        }
      }}
      onTemplateDelete={async (templateId: string) => {
        try {
          await api.del(`/api/message-templates/${templateId}`)
          const updated = await api.get<MessageTemplate[]>('/api/message-templates')
          setMessageTemplates(Array.isArray(updated) ? updated : [])
        } catch (err) {
          console.error('Failed to delete template:', err)
        }
      }}
    />
  )
}
