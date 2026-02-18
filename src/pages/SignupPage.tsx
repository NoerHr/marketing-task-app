import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AuthenticationView } from '@/components/authentication'
import type { AuthScreen, InviteData } from '@/types/authentication'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'

const emptyLoginForm = { email: '', password: '', rememberMe: false, error: null }
const emptyRegisterForm = { email: '', fullName: '', password: '', confirmPassword: '' }
const emptyForgotForm = { email: '', submitted: false, error: null }
const emptyResetForm = { newPassword: '', confirmPassword: '', tokenValid: true }
const emptyVerification = { email: '', isVerified: false, resendCooldownSeconds: 0 }

export default function SignupPage() {
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>('register')
  const [inviteData, setInviteData] = useState<InviteData | null>(null)
  const [registerError, setRegisterError] = useState<string | null>(null)
  const [searchParams] = useSearchParams()
  const { register } = useAuth()
  const navigate = useNavigate()

  const inviteToken = searchParams.get('token') || ''

  // Verify invite token
  useEffect(() => {
    if (!inviteToken) {
      setCurrentScreen('invite-expired')
      return
    }
    ;(async () => {
      try {
        const data = await api.get<InviteData>(`/api/auth/invite/${inviteToken}`)
        setInviteData(data)
      } catch {
        setCurrentScreen('invite-expired')
      }
    })()
  }, [inviteToken])

  return (
    <AuthenticationView
      currentScreen={currentScreen}
      loginForm={{ ...emptyLoginForm, error: registerError }}
      inviteData={inviteData}
      registerForm={{
        ...emptyRegisterForm,
        email: inviteData?.invitedEmail || '',
      }}
      forgotPasswordForm={emptyForgotForm}
      resetPasswordForm={emptyResetForm}
      emailVerification={emptyVerification}
      onLogin={() => {}}
      onRegister={async (fullName, password) => {
        try {
          setRegisterError(null)
          await register(inviteToken, fullName, password, inviteData?.invitedEmail)
          navigate('/dashboard')
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Registration failed'
          setRegisterError(message)
        }
      }}
      onForgotPassword={() => {}}
      onResetPassword={() => {}}
      onResendVerification={() => {}}
      onNavigate={(screen) => {
        if (screen === 'login') {
          navigate('/login')
        } else {
          setCurrentScreen(screen)
        }
      }}
    />
  )
}
