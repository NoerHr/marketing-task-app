/** Auth screen being displayed */
export type AuthScreen =
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'reset-password'
  | 'email-verification'
  | 'invite-expired'

/** Login form state */
export interface LoginForm {
  email: string
  password: string
  rememberMe: boolean
  error: string | null
}

/** Invite link data for registration */
export interface InviteData {
  teamName: string
  invitedEmail: string
  invitedByName: string
  isValid: boolean
  expiresAt: string
}

/** Registration form state */
export interface RegisterForm {
  email: string
  fullName: string
  password: string
  confirmPassword: string
}

/** Forgot password form state */
export interface ForgotPasswordForm {
  email: string
  submitted: boolean
  error: string | null
}

/** Reset password form state */
export interface ResetPasswordForm {
  newPassword: string
  confirmPassword: string
  tokenValid: boolean
}

/** Email verification screen state */
export interface EmailVerification {
  email: string
  isVerified: boolean
  resendCooldownSeconds: number
}

/** Authentication section props */
export interface AuthenticationProps {
  currentScreen: AuthScreen
  loginForm: LoginForm
  inviteData: InviteData | null
  registerForm: RegisterForm
  forgotPasswordForm: ForgotPasswordForm
  resetPasswordForm: ResetPasswordForm
  emailVerification: EmailVerification

  /** Called when user submits login form */
  onLogin?: (email: string, password: string, rememberMe: boolean) => void
  /** Called when user submits registration form */
  onRegister?: (fullName: string, password: string) => void
  /** Called when user submits forgot password form */
  onForgotPassword?: (email: string) => void
  /** Called when user submits reset password form */
  onResetPassword?: (newPassword: string) => void
  /** Called when user clicks resend verification email */
  onResendVerification?: () => void
  /** Called when user navigates between auth screens */
  onNavigate?: (screen: AuthScreen) => void
}
