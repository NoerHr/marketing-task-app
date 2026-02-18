import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthenticationView } from '@/components/authentication'
import type { AuthScreen } from '@/types/authentication'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'

const emptyLoginForm = { email: '', password: '', rememberMe: false, error: null }
const emptyRegisterForm = { email: '', fullName: '', password: '', confirmPassword: '' }
const emptyForgotForm = { email: '', submitted: false, error: null }
const emptyResetForm = { newPassword: '', confirmPassword: '', tokenValid: true }
const emptyVerification = { email: '', isVerified: false, resendCooldownSeconds: 0 }

export default function LoginPage() {
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>('login')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [forgotSubmitted, setForgotSubmitted] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  return (
    <AuthenticationView
      currentScreen={currentScreen}
      loginForm={{ ...emptyLoginForm, error: loginError }}
      inviteData={null}
      registerForm={emptyRegisterForm}
      forgotPasswordForm={{ ...emptyForgotForm, submitted: forgotSubmitted }}
      resetPasswordForm={emptyResetForm}
      emailVerification={emptyVerification}
      onLogin={async (email, password) => {
        try {
          setLoginError(null)
          await login(email, password)
          navigate('/dashboard')
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Login failed'
          setLoginError(message)
        }
      }}
      onRegister={() => {}}
      onForgotPassword={async (email) => {
        try {
          await api.post('/api/auth/forgot-password', { email })
          setForgotSubmitted(true)
        } catch {
          // Silently handle — don't reveal if email exists
          setForgotSubmitted(true)
        }
      }}
      onResetPassword={() => {}}
      onResendVerification={() => {}}
      onNavigate={(screen) => {
        if (screen === 'register') {
          navigate('/signup')
        } else {
          setCurrentScreen(screen)
        }
      }}
    />
  )
}
